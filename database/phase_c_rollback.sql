-- ============================================================
-- Phase C ROLLBACK
-- Run this ONLY if phase_c_association_causes.sql was already
-- executed and needs to be undone.
--
-- What this does:
--   1. Drops AssociationCauses (new table, no existing data).
--   2. Restores sp_RegisterOrganization to its pre-Phase-C form
--      (removes @cause_ids_csv param and Step B.5 insert).
--
-- What this does NOT do:
--   - Touch Users, Associations, Causes, or UserCauses.
--   - Affect any existing association registrations.
-- ============================================================

-- Step 1: Drop junction table (safe — new table, zero rows in prod
-- before Phase C migration has been used to register any association).
IF OBJECT_ID('dbo.AssociationCauses', 'U') IS NOT NULL
    DROP TABLE dbo.AssociationCauses;
GO

-- Step 2: Restore sp_RegisterOrganization to pre-Phase-C definition.
-- This is the exact original body; @cause_ids_csv and Step B.5 are absent.
CREATE OR ALTER PROCEDURE [dbo].[sp_RegisterOrganization]
    -- User / authentication fields
    @full_name          NVARCHAR(100),
    @email              NVARCHAR(100),
    @user_password      NVARCHAR(255),
    @phone              NVARCHAR(20)  = NULL,
    @location           NVARCHAR(100) = NULL,

    -- Association / business fields
    @association_name   NVARCHAR(100),
    @org_number         NVARCHAR(50)  = NULL,
    @address            NVARCHAR(200),
    @city               NVARCHAR(100) = NULL,
    @work_mode          NVARCHAR(50),
    @delivery_mode      NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

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

    IF @association_name IS NULL OR LTRIM(RTRIM(@association_name)) = ''
    BEGIN
        RAISERROR('Association name is required.', 16, 1);
        RETURN;
    END

    IF @address IS NULL OR LTRIM(RTRIM(@address)) = ''
    BEGIN
        RAISERROR('Address is required.', 16, 1);
        RETURN;
    END

    IF @work_mode NOT IN ('SecondHandStores', 'OwnStore', 'PhysicalOnly')
    BEGIN
        RAISERROR('work_mode must be SecondHandStores, OwnStore, or PhysicalOnly.', 16, 1);
        RETURN;
    END

    IF @delivery_mode NOT IN ('Pickup', 'SelfArrival', 'Both')
    BEGIN
        RAISERROR('delivery_mode must be Pickup, SelfArrival, or Both.', 16, 1);
        RETURN;
    END

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

    IF EXISTS (SELECT 1 FROM Associations WHERE email = @email)
    BEGIN
        RAISERROR('An association with this email already exists.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Associations WHERE association_name = @association_name)
    BEGIN
        RAISERROR('An association with this name already exists.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

    BEGIN TRY

        -- Step A: insert the authentication user row
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
            'Association'
        );

        DECLARE @new_user_id INT = SCOPE_IDENTITY();

        -- Step B: insert the association row
        INSERT INTO Associations
        (
            association_name,
            address,
            city,
            email,
            phone,
            work_mode,
            delivery_mode,
            is_available,
            org_number,
            user_id
        )
        VALUES
        (
            @association_name,
            @address,
            @city,
            @email,
            @phone,
            @work_mode,
            @delivery_mode,
            1,
            @org_number,
            @new_user_id
        );

        -- Step C: return the user row
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

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage  NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT            = ERROR_SEVERITY();
        DECLARE @ErrorState    INT            = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);

    END CATCH
END
GO
