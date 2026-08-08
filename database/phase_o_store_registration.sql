-- ============================================================
-- Phase O: Store registration (Users + SecondHandStores)
--
-- Run once against RewearDB on Azure, manually via SSMS.
-- Run BEFORE deploying the backend changes that call
-- sp_RegisterStore (server/DAL/StoreDAL.cs, StoresController.cs).
--
-- This script is idempotent: every object it creates is guarded
-- by an existence check, so it is safe to run more than once —
-- re-running it after a partial or full previous run is a no-op
-- for anything that already exists.
--
-- What this script does, in order:
--   1. Ensures SecondHandStores.user_id exists (only adds it if
--      missing — some environments may already have this column
--      from earlier manual setup, the same way Associations.user_id
--      was never captured in a tracked migration either).
--   2. Adds a foreign key from SecondHandStores.user_id to
--      Users.user_id (only if not already present).
--   3. Adds a filtered unique index on SecondHandStores.user_id
--      (only if not already present) so each Users row can be
--      linked to at most one store, while still allowing multiple
--      pre-existing rows with NULL user_id.
--   4. Creates or alters sp_RegisterStore, which inserts a Users
--      row (user_type = 'Store') and a SecondHandStores row in a
--      single transaction, rolling back both on any failure.
--
-- What this script does NOT do:
--   - It never runs an UPDATE, INSERT, or DELETE against Users,
--     Associations, or SecondHandStores. The only INSERT
--     statements in this file are inside sp_RegisterStore's body,
--     which defines the procedure but does not execute it.
--   - It never modifies sp_CreateStore, sp_CheckStoreExists,
--     sp_GetNearbyStoresForAssociation, sp_RegisterOrganization,
--     sp_RegisterUser, or sp_LoginUser.
--   - It never touches existing SecondHandStores rows that
--     currently have user_id = NULL — no value is backfilled or
--     guessed for them.
--
-- After this migration, Store accounts authenticate through the
-- exact same sp_LoginUser / Users table as every other user_type
-- — no separate login procedure or endpoint is introduced.
--
-- Before running: if SecondHandStores.user_id already exists on
-- this database (likely, per the above), it's worth confirming
-- its type is INT and that it holds no non-NULL values without a
-- matching Users.user_id row — the FK step below will fail with a
-- clear SQL Server error if that's not the case, but checking
-- first (e.g. `EXEC sp_help 'SecondHandStores';`) avoids a
-- mid-script surprise.
-- ============================================================


-- ------------------------------------------------------------
-- SECTION 1 — SecondHandStores.user_id column
--
-- Adds the column only if it does not already exist. If it's
-- added fresh, every existing row automatically gets NULL in
-- this new column (SQL Server default for a nullable column with
-- no DEFAULT clause) — no existing row's data is touched.
-- ------------------------------------------------------------

IF COL_LENGTH('dbo.SecondHandStores', 'user_id') IS NULL
BEGIN
    ALTER TABLE dbo.SecondHandStores ADD user_id INT NULL;
END
GO


-- ------------------------------------------------------------
-- SECTION 2 — Foreign key: SecondHandStores.user_id -> Users.user_id
--
-- Only added if a constraint with this exact name doesn't already
-- exist, so this section is safe to re-run. NULL values in
-- user_id are exempt from FK validation by default in SQL Server,
-- so pre-existing rows with user_id = NULL are unaffected and
-- will not be rejected by this constraint.
-- ------------------------------------------------------------

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_SecondHandStores_Users'
)
BEGIN
    ALTER TABLE dbo.SecondHandStores
        ADD CONSTRAINT FK_SecondHandStores_Users
        FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id);
END
GO


-- ------------------------------------------------------------
-- SECTION 3 — Filtered unique index on SecondHandStores.user_id
--
-- Enforces "one store per Users row" going forward, without
-- breaking existing data. This must be a FILTERED unique index
-- (WHERE user_id IS NOT NULL) rather than a plain UNIQUE
-- constraint: SQL Server treats NULL as a comparable value in a
-- plain UNIQUE constraint/index and only allows a single NULL row,
-- which would fail immediately given the multiple pre-existing
-- SecondHandStores rows that have no linked user yet. Only
-- created if an index with this exact name doesn't already exist
-- on this table, so this section is safe to re-run.
-- ------------------------------------------------------------

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_SecondHandStores_UserId'
      AND object_id = OBJECT_ID('dbo.SecondHandStores')
)
BEGIN
    CREATE UNIQUE INDEX UQ_SecondHandStores_UserId
        ON dbo.SecondHandStores(user_id)
        WHERE user_id IS NOT NULL;
END
GO


-- ------------------------------------------------------------
-- SECTION 4 — sp_RegisterStore
--
-- New stored procedure (does not replace sp_CreateStore, which
-- remains untouched for its existing, narrower, no-login use).
-- CREATE OR ALTER makes this section idempotent by design: it
-- succeeds identically whether sp_RegisterStore already exists
-- or not.
--
-- Structurally mirrors sp_RegisterOrganization (see
-- phase_c_association_causes.sql): same style of guard clauses,
-- same single-transaction shape, same TRY/CATCH rollback, and the
-- same final SELECT column list as sp_LoginUser's result set, so
-- the C# DAL mapper is identical for both.
-- ------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[sp_RegisterStore]
    -- User / authentication fields
    @full_name      NVARCHAR(100),
    @email          NVARCHAR(100),
    @user_password  NVARCHAR(255),
    @phone          NVARCHAR(20)  = NULL,
    @location       NVARCHAR(100) = NULL,

    -- Store / business fields
    @store_name     NVARCHAR(100),
    @address        NVARCHAR(200),
    @city           NVARCHAR(100) = NULL,
    @area           NVARCHAR(100) = NULL,
    @description    NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Required-field validation (mirrors sp_RegisterOrganization's
    -- guard-clause style: check, RAISERROR, RETURN before ever
    -- opening a transaction).

    IF @email IS NULL OR LTRIM(RTRIM(@email)) = ''
    BEGIN
        RAISERROR('Email is required.', 16, 1);
        RETURN;
    END

    IF @full_name IS NULL OR LTRIM(RTRIM(@full_name)) = ''
    BEGIN
        RAISERROR('Full name is required.', 16, 1);
        RETURN;
    END

    IF @store_name IS NULL OR LTRIM(RTRIM(@store_name)) = ''
    BEGIN
        RAISERROR('Store name is required.', 16, 1);
        RETURN;
    END

    IF @address IS NULL OR LTRIM(RTRIM(@address)) = ''
    BEGIN
        RAISERROR('Address is required.', 16, 1);
        RETURN;
    END

    -- Uniqueness validation — checked before the transaction opens
    -- so a duplicate request fails fast without touching either
    -- table. The DB-level UNIQUE constraints on Users.email,
    -- Users.username, and SecondHandStores.email are still the
    -- final safety net against a race between two concurrent
    -- registrations; these checks just produce a friendlier,
    -- specific error message in the common case.

    IF EXISTS (SELECT 1 FROM Users WHERE email = @email)
    BEGIN
        RAISERROR('An account with this email already exists.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Users WHERE username = @email)
    BEGIN
        RAISERROR('An account with this username already exists.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM SecondHandStores WHERE email = @email)
    BEGIN
        RAISERROR('A store with this email already exists.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM SecondHandStores WHERE store_name = @store_name)
    BEGIN
        RAISERROR('A store with this name already exists.', 16, 1);
        RETURN;
    END

    -- Single transaction: both inserts succeed together or neither
    -- is kept. If Step B fails after Step A has run, the CATCH
    -- block below rolls back Step A too, so no login-only orphan
    -- Users row is ever left behind.

    BEGIN TRANSACTION;

    BEGIN TRY

        -- Step A: insert the authentication user row
        -- (user_type = 'Store' is the only thing that makes this
        -- account a "Store" — sp_LoginUser and every other login
        -- code path treat it exactly like a Private or Association
        -- row; there is no separate Store login mechanism.)
        INSERT INTO Users
        (
            full_name,
            username,
            user_password,
            email,
            phone,
            location,
            signup_method,
            user_type
        )
        VALUES
        (
            @full_name,
            @email,
            @user_password,
            @email,
            @phone,
            @location,
            'Email',
            'Store'
        );

        DECLARE @new_user_id INT = SCOPE_IDENTITY();

        -- Step B: insert the store row, linked via user_id
        INSERT INTO SecondHandStores
        (
            store_name,
            address,
            city,
            area,
            email,
            phone,
            description,
            user_id
        )
        VALUES
        (
            @store_name,
            @address,
            @city,
            @area,
            @email,
            @phone,
            @description,
            @new_user_id
        );

        -- Step C: return the new user row so the caller (StoreDAL.
        -- RegisterStore) can hand it straight to the client, the
        -- same way sp_RegisterOrganization and sp_LoginUser do.
        SELECT
            user_id,
            full_name,
            username,
            email,
            phone,
            location,
            signup_method,
            user_type
        FROM Users
        WHERE user_id = @new_user_id;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        -- Rollback: undo both inserts on any error (constraint
        -- violation, deadlock, etc.), then re-raise the original
        -- error message/severity/state so it surfaces in the C#
        -- layer as a SqlException with the original text intact.
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage  NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT            = ERROR_SEVERITY();
        DECLARE @ErrorState    INT            = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);

    END CATCH
END
GO
