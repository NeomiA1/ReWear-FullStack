-- ============================================================
-- Phase F: AssociationCategories (AcceptedCategories only)
-- Run against RewearDB on Azure BEFORE deploying backend changes.
--
-- category_id values come from the existing client-side dictionary
-- (client/src/data/associations.js CATEGORIES): baby, children, teen,
-- adult, elderly. No new categories are introduced and no Categories
-- lookup table is created here — the fixed list is validated inline,
-- the same way work_mode/delivery_mode are validated in
-- sp_RegisterOrganization. CurrentNeeds is out of scope for this phase.
-- ============================================================

-- ------------------------------------------------------------
-- Table: AssociationCategories
-- ------------------------------------------------------------

IF OBJECT_ID('dbo.AssociationCategories', 'U') IS NULL
BEGIN
    CREATE TABLE AssociationCategories (
        association_id  INT         NOT NULL FOREIGN KEY REFERENCES Associations(association_id),
        category_id     VARCHAR(50) NOT NULL,
        CONSTRAINT PK_AssociationCategories PRIMARY KEY (association_id, category_id),
        CONSTRAINT CK_AssociationCategories_category_id
            CHECK (category_id IN ('baby', 'children', 'teen', 'adult', 'elderly'))
    );
END
GO

-- ------------------------------------------------------------
-- sp_RegisterOrganization: ALTER to accept optional accepted categories.
-- Only the @category_ids_csv param and Step B.6 below are new; every
-- other line is preserved exactly from the current (Phase C) definition.
-- ------------------------------------------------------------

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
    @delivery_mode      NVARCHAR(50),

    -- Optional CSV of cause_id keys (Phase C). NULL/empty = none saved.
    @cause_ids_csv      NVARCHAR(MAX) = NULL,

    -- [NEW] Optional CSV of category_id keys. NULL/empty = none saved.
    @category_ids_csv   NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Parameter validation (unchanged from current Azure definition)

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

    -- Transaction (unchanged structure; Step B.6 is the only addition)

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

        DECLARE @new_association_id INT = SCOPE_IDENTITY();

        -- Step B.5 (Phase C): link selected causes (optional).
        INSERT INTO AssociationCauses (association_id, cause_id)
        SELECT DISTINCT @new_association_id, c.cause_id
        FROM STRING_SPLIT(@cause_ids_csv, ',') s
        INNER JOIN Causes c ON c.cause_id = LTRIM(RTRIM(s.value))
        WHERE LTRIM(RTRIM(s.value)) <> '';

        -- [NEW] Step B.6: link accepted categories (optional).
        -- Fixed, known list — validated inline since there is no
        -- Categories lookup table yet. Unknown values are silently
        -- dropped (same "ignore invalid, don't fail" behavior as causes).
        INSERT INTO AssociationCategories (association_id, category_id)
        SELECT DISTINCT @new_association_id, LTRIM(RTRIM(s.value))
        FROM STRING_SPLIT(@category_ids_csv, ',') s
        WHERE LTRIM(RTRIM(s.value)) IN ('baby', 'children', 'teen', 'adult', 'elderly');

        -- Step C: return the user row (unchanged)
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
