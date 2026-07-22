USE [REWEAR_DB];
GO

/* =========================================================
   Phase D
   DonationBag assignment and lifecycle status
   ========================================================= */


/* 1. Add assigned_association_id */
IF COL_LENGTH('dbo.DonationBags', 'assigned_association_id') IS NULL
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD assigned_association_id INT NULL;
END
GO


/* 2. Add foreign key to Associations */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_DonationBags_Associations'
)
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD CONSTRAINT FK_DonationBags_Associations
        FOREIGN KEY (assigned_association_id)
        REFERENCES dbo.Associations(association_id);
END
GO


/* 3. Add donation_status */
IF COL_LENGTH('dbo.DonationBags', 'donation_status') IS NULL
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD donation_status NVARCHAR(50) NOT NULL
        CONSTRAINT DF_DonationBags_DonationStatus
        DEFAULT N'Draft';
END
GO


/* 4. Restrict the possible statuses */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_DonationBags_DonationStatus'
)
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD CONSTRAINT CK_DonationBags_DonationStatus
    CHECK
    (
        donation_status IN
        (
            N'Draft',
            N'Published',
            N'WaitingForAssociation',
            N'Accepted',
            N'Rejected',
            N'PickupScheduled',
            N'Completed'
        )
    );
END
GO


/* 5. Update create bag procedure */
CREATE OR ALTER PROCEDURE dbo.sp_CreateDonationBag
    @user_id INT,
    @short_description NVARCHAR(500) = NULL,
    @sizes NVARCHAR(100) = NULL,
    @target_ages NVARCHAR(100) = NULL,
    @target_gender NVARCHAR(50) = NULL,
    @clothes_condition NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Users
        WHERE user_id = @user_id
    )
    BEGIN
        THROW 50001, 'User does not exist.', 1;
    END

    INSERT INTO dbo.DonationBags
    (
        user_id,
        short_description,
        sizes,
        target_ages,
        target_gender,
        clothes_condition,
        assigned_association_id,
        donation_status
    )
    VALUES
    (
        @user_id,
        @short_description,
        @sizes,
        @target_ages,
        @target_gender,
        @clothes_condition,
        NULL,
        N'Draft'
    );
END
GO


/* 6. Update get bags procedure */
CREATE OR ALTER PROCEDURE dbo.sp_GetDonationBagsByUserId
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        bag_id,
        user_id,
        short_description,
        sizes,
        target_ages,
        target_gender,
        clothes_condition,
        assigned_association_id,
        donation_status,
        created_at
    FROM dbo.DonationBags
    WHERE user_id = @user_id
    ORDER BY created_at DESC;
END
GO


/* 7. Update a bag status */
CREATE OR ALTER PROCEDURE dbo.sp_UpdateDonationBagStatus
    @bag_id INT,
    @donation_status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF @donation_status NOT IN
    (
        N'Draft',
        N'Published',
        N'WaitingForAssociation',
        N'Accepted',
        N'Rejected',
        N'PickupScheduled',
        N'Completed'
    )
    BEGIN
        THROW 50002, 'Invalid donation bag status.', 1;
    END

    UPDATE dbo.DonationBags
    SET donation_status = @donation_status
    WHERE bag_id = @bag_id;

    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50003, 'Donation bag does not exist.', 1;
    END
END
GO


/* 8. Replace the bag-link procedure.
      This procedure prevents the same bag from being sent twice. */
CREATE OR ALTER PROCEDURE dbo.sp_LinkBagToDonationRequest
    @request_id INT,
    @bag_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @association_id INT;
        DECLARE @current_association_id INT;
        DECLARE @current_status NVARCHAR(50);

        /* Check that the donation request exists */
        SELECT
            @association_id = association_id
        FROM dbo.DonationRequests
        WHERE request_id = @request_id;

        IF @association_id IS NULL
        BEGIN
            THROW 50010, 'Donation request does not exist.', 1;
        END


        /* Lock the bag so two requests cannot assign it simultaneously */
        SELECT
            @current_association_id = assigned_association_id,
            @current_status = donation_status
        FROM dbo.DonationBags WITH (UPDLOCK, HOLDLOCK)
        WHERE bag_id = @bag_id;

        IF @current_status IS NULL
        BEGIN
            THROW 50011, 'Donation bag does not exist.', 1;
        END


        /* The important server-side protection */
        IF @current_association_id IS NOT NULL
           OR @current_status IN
              (
                  N'WaitingForAssociation',
                  N'Accepted',
                  N'PickupScheduled',
                  N'Completed'
              )
        BEGIN
            THROW 50012,
                  'Donation bag has already been sent to an association.',
                  1;
        END


        /* Prevent duplicate row in the linking table */
        IF EXISTS
        (
            SELECT 1
            FROM dbo.DonationRequestBags
            WHERE bag_id = @bag_id
        )
        BEGIN
            THROW 50012,
                  'Donation bag has already been sent to an association.',
                  1;
        END


        INSERT INTO dbo.DonationRequestBags
        (
            request_id,
            bag_id
        )
        VALUES
        (
            @request_id,
            @bag_id
        );


        UPDATE dbo.DonationBags
        SET
            assigned_association_id = @association_id,
            donation_status = N'WaitingForAssociation'
        WHERE bag_id = @bag_id;


        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH
END
GO


/* 9. Add database-level protection.
      A bag may appear only once in DonationRequestBags. */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_DonationRequestBags_BagId'
      AND object_id = OBJECT_ID('dbo.DonationRequestBags')
)
BEGIN
    CREATE UNIQUE INDEX UX_DonationRequestBags_BagId
    ON dbo.DonationRequestBags(bag_id);
END
GO
/* =========================================================
   10. Respond to a donation request
   Updates both the request and all bags linked to it
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_RespondDonationRequest
    @request_id INT,
    @new_status NVARCHAR(50),
    @association_response NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @normalized_status NVARCHAR(50);
        DECLARE @bag_status NVARCHAR(50);

        /* Remove unnecessary spaces */
        SET @normalized_status = LTRIM(RTRIM(@new_status));


        /* Check that the request exists */
        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.DonationRequests
            WHERE request_id = @request_id
        )
        BEGIN
            THROW 50020,
                  'Donation request does not exist.',
                  1;
        END


        /* The association may only accept or reject */
        IF UPPER(@normalized_status) IN
        (
            N'ACCEPTED',
            N'APPROVED'
        )
        BEGIN
            SET @normalized_status = N'Accepted';
            SET @bag_status = N'Accepted';
        END
        ELSE IF UPPER(@normalized_status) = N'REJECTED'
        BEGIN
            SET @normalized_status = N'Rejected';
            SET @bag_status = N'Rejected';
        END
        ELSE
        BEGIN
            THROW 50021,
                  'Status must be Accepted or Rejected.',
                  1;
        END


        /* Update the donation request */
        UPDATE dbo.DonationRequests
        SET
            request_status = @normalized_status,
            association_response = @association_response,
            response_date = GETDATE()
        WHERE request_id = @request_id;


        /* Update every bag linked to this request */
        UPDATE db
        SET
            db.donation_status = @bag_status
        FROM dbo.DonationBags db
        INNER JOIN dbo.DonationRequestBags drb
            ON db.bag_id = drb.bag_id
        WHERE drb.request_id = @request_id;


        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        THROW;

    END CATCH
END
GO