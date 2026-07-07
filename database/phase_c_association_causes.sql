-- ============================================================
-- Phase C: AssociationCauses
-- Run against RewearDB on Azure BEFORE deploying backend changes.
-- ============================================================

-- ------------------------------------------------------------
-- Table: AssociationCauses
-- ------------------------------------------------------------

IF OBJECT_ID('dbo.AssociationCauses', 'U') IS NULL
BEGIN
    CREATE TABLE AssociationCauses (
        association_id  INT          NOT NULL FOREIGN KEY REFERENCES Associations(association_id),
        cause_id        VARCHAR(50)  NOT NULL FOREIGN KEY REFERENCES Causes(cause_id),
        CONSTRAINT PK_AssociationCauses PRIMARY KEY (association_id, cause_id)
    );
END
GO

-- ------------------------------------------------------------
-- sp_RegisterOrganization: ALTER to accept optional causes.
-- Only the two additions below are new; all other logic is
-- preserved exactly from the current Azure definition.
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

    -- [NEW] Optional CSV of cause_id keys. NULL or empty = no causes saved.
    @cause_ids_csv      NVARCHAR(MAX) = NULL
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

    -- Transaction (unchanged structure; Step B.5 is the only addition)

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

        -- [NEW] Step B.5: link selected causes (optional).
        -- SCOPE_IDENTITY() here returns association_id because
        -- Associations.association_id is IDENTITY and the INSERT above
        -- is the most recent identity insert in this scope.
        -- STRING_SPLIT(NULL, ',') yields zero rows — NULL/empty CSV is safe.
        -- INNER JOIN Causes drops any unknown cause_id (FK-safe).
        DECLARE @new_association_id INT = SCOPE_IDENTITY();

        INSERT INTO AssociationCauses (association_id, cause_id)
        SELECT DISTINCT @new_association_id, c.cause_id
        FROM STRING_SPLIT(@cause_ids_csv, ',') s
        INNER JOIN Causes c ON c.cause_id = LTRIM(RTRIM(s.value))
        WHERE LTRIM(RTRIM(s.value)) <> '';

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
