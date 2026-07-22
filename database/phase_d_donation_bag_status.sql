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
/* =========================================================
   11. Create donation request only for an available association
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_CreateDonationRequest
    @user_id INT,
    @association_id INT,
    @delivery_type NVARCHAR(50),
    @contact_phone NVARCHAR(30) = NULL,
    @pickup_address NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    /* Check that the user exists */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Users
        WHERE user_id = @user_id
    )
    BEGIN
        THROW 50030,
              'User does not exist.',
              1;
    END;


    /* Check that the association exists */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Associations
        WHERE association_id = @association_id
    )
    BEGIN
        THROW 50031,
              'Association does not exist.',
              1;
    END;


    /* Check availability immediately before creating the request */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Associations
        WHERE association_id = @association_id
          AND is_available = 1
    )
    BEGIN
        THROW 50032,
              'This association is currently unavailable for donations.',
              1;
    END;


    /* Validate delivery type */
    IF @delivery_type IS NULL
       OR LTRIM(RTRIM(@delivery_type)) = N''
    BEGIN
        THROW 50033,
              'Delivery type is required.',
              1;
    END;


    INSERT INTO dbo.DonationRequests
    (
        user_id,
        association_id,
        request_date,
        delivery_type,
        contact_phone,
        pickup_address,
        request_status
    )
    VALUES
    (
        @user_id,
        @association_id,
        GETDATE(),
        @delivery_type,
        @contact_phone,
        @pickup_address,
        N'Pending'
    );


    /* Return the new request ID to the server */
    SELECT CAST(SCOPE_IDENTITY() AS INT);
END
GO
/* =========================================================
   12. Expire donation requests after 14 days
   ========================================================= */


/*
Add an active/inactive marker to the connection between
a donation request and a donation bag.

This allows us to keep the request history while releasing
the bag so it can be sent to another association.
*/
IF COL_LENGTH(
    'dbo.DonationRequestBags',
    'is_active'
) IS NULL
BEGIN
    ALTER TABLE dbo.DonationRequestBags
    ADD is_active BIT NOT NULL
        CONSTRAINT DF_DonationRequestBags_IsActive
        DEFAULT 1;
END
GO


/*
Remove the previous unique index, because it prevents a bag
from ever being linked to another request—even after expiry.
*/
IF EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_DonationRequestBags_BagId'
      AND object_id =
          OBJECT_ID('dbo.DonationRequestBags')
)
BEGIN
    DROP INDEX UX_DonationRequestBags_BagId
    ON dbo.DonationRequestBags;
END
GO


/*
A bag may have only one active donation request,
but it may retain inactive historical requests.
*/
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name =
        'UX_DonationRequestBags_ActiveBagId'
      AND object_id =
          OBJECT_ID('dbo.DonationRequestBags')
)
BEGIN
    CREATE UNIQUE INDEX
        UX_DonationRequestBags_ActiveBagId
    ON dbo.DonationRequestBags(bag_id)
    WHERE is_active = 1;
END
GO


/*
Update the procedure that connects a bag to a request.
Only an active connection prevents another submission.
*/
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

        SELECT
            @association_id = association_id
        FROM dbo.DonationRequests
        WHERE request_id = @request_id;

        IF @association_id IS NULL
        BEGIN
            THROW 50010,
                  'Donation request does not exist.',
                  1;
        END;


        SELECT
            @current_association_id =
                assigned_association_id,

            @current_status =
                donation_status

        FROM dbo.DonationBags
            WITH (UPDLOCK, HOLDLOCK)

        WHERE bag_id = @bag_id;


        IF @current_status IS NULL
        BEGIN
            THROW 50011,
                  'Donation bag does not exist.',
                  1;
        END;


        IF EXISTS
        (
            SELECT 1
            FROM dbo.DonationRequestBags
            WHERE bag_id = @bag_id
              AND is_active = 1
        )
        BEGIN
            THROW 50012,
                  'Donation bag has already been sent to an association.',
                  1;
        END;


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
        END;


        INSERT INTO dbo.DonationRequestBags
        (
            request_id,
            bag_id,
            is_active
        )
        VALUES
        (
            @request_id,
            @bag_id,
            1
        );


        UPDATE dbo.DonationBags
        SET
            assigned_association_id =
                @association_id,

            donation_status =
                N'WaitingForAssociation'

        WHERE bag_id = @bag_id;


        COMMIT TRANSACTION;

    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        THROW;

    END CATCH
END
GO


/*
Automatically expires requests that have remained pending
for at least 14 days.

The linked bags are released and can then be sent to
another association.
*/
CREATE OR ALTER PROCEDURE dbo.sp_ExpireDonationRequests
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @ExpiredRequests TABLE
        (
            request_id INT PRIMARY KEY
        );


        /*
        Find requests that are still waiting after 14 days.
        */
        INSERT INTO @ExpiredRequests
        (
            request_id
        )
        SELECT
            request_id
        FROM dbo.DonationRequests
            WITH (UPDLOCK, HOLDLOCK)
        WHERE request_status IN
        (
            N'Pending',
            N'PENDING',
            N'WaitingForAssociation'
        )
        AND request_date <=
            DATEADD(DAY, -14, GETDATE());


        /*
        Mark the donation requests as expired.
        */
        UPDATE dr
        SET
            dr.request_status = N'Expired',

            dr.association_response =
                COALESCE(
                    dr.association_response,
                    N'The request expired after 14 days without a response.'
                ),

            dr.response_date = GETDATE()

        FROM dbo.DonationRequests dr

        INNER JOIN @ExpiredRequests er
            ON dr.request_id = er.request_id;


        /*
        Release the bags from the associations.
        */
        UPDATE db
        SET
            db.assigned_association_id = NULL,
            db.donation_status = N'Draft'

        FROM dbo.DonationBags db

        INNER JOIN dbo.DonationRequestBags drb
            ON db.bag_id = drb.bag_id

        INNER JOIN @ExpiredRequests er
            ON drb.request_id = er.request_id

        WHERE drb.is_active = 1;


        /*
        Keep the history, but mark the old connection inactive.
        */
        UPDATE drb
        SET
            drb.is_active = 0

        FROM dbo.DonationRequestBags drb

        INNER JOIN @ExpiredRequests er
            ON drb.request_id = er.request_id

        WHERE drb.is_active = 1;


        /*
        Return the number of expired requests.
        */
        SELECT COUNT(*) AS expired_requests_count
        FROM @ExpiredRequests;


        COMMIT TRANSACTION;

    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        THROW;

    END CATCH
END
GO
/* =========================================================
   13. Delete donation bag and related database records
   Physical files are deleted by the server controller
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_DeleteDonationBag
    @bag_id INT,
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        /* Check that the bag exists and belongs to the user */
        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.DonationBags
            WHERE bag_id = @bag_id
              AND user_id = @user_id
        )
        BEGIN
            THROW 50040,
                  'Donation bag does not exist or does not belong to this user.',
                  1;
        END;


        /* Do not allow deleting a bag that is currently active */
        IF EXISTS
        (
            SELECT 1
            FROM dbo.DonationRequestBags
            WHERE bag_id = @bag_id
              AND is_active = 1
        )
        BEGIN
            THROW 50041,
                  'An active donation bag cannot be deleted.',
                  1;
        END;


        /* Delete old inactive request links */
        DELETE FROM dbo.DonationRequestBags
        WHERE bag_id = @bag_id;


        /* Delete database media records */
        DELETE FROM dbo.BagMedia
        WHERE bag_id = @bag_id;


        /* Delete the bag itself */
        DELETE FROM dbo.DonationBags
        WHERE bag_id = @bag_id
          AND user_id = @user_id;


        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        THROW;

    END CATCH
END
GO
/* =========================================================
   14. Donation bag creator and last update date
   ========================================================= */


/* Add last update date to DonationBags */
IF COL_LENGTH(
    'dbo.DonationBags',
    'updated_at'
) IS NULL
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD updated_at DATETIME2 NOT NULL
        CONSTRAINT DF_DonationBags_UpdatedAt
        DEFAULT SYSDATETIME();
END
GO


/* Set existing records to their creation date */
UPDATE dbo.DonationBags
SET updated_at = created_at
WHERE updated_at IS NULL;
GO


/*
Automatically update updated_at whenever a donation bag changes.
*/
CREATE OR ALTER TRIGGER dbo.trg_DonationBags_SetUpdatedAt
ON dbo.DonationBags
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF TRIGGER_NESTLEVEL() > 1
    BEGIN
        RETURN;
    END;

    UPDATE db
    SET updated_at = SYSDATETIME()
    FROM dbo.DonationBags db
    INNER JOIN inserted i
        ON db.bag_id = i.bag_id;
END
GO


/*
Return the creator name, creation date and last update date.
*/
CREATE OR ALTER PROCEDURE dbo.sp_GetDonationBagsByUserId
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        db.bag_id,
        db.user_id,
        u.full_name AS creator_name,
        db.short_description,
        db.sizes,
        db.target_ages,
        db.target_gender,
        db.clothes_condition,
        db.assigned_association_id,
        db.donation_status,
        db.created_at,
        db.updated_at
    FROM dbo.DonationBags db
    INNER JOIN dbo.Users u
        ON db.user_id = u.user_id
    WHERE db.user_id = @user_id
    ORDER BY db.created_at DESC;
END
GO
/* =========================================================
   15. Real donation statistics for the user profile
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_GetUserDonationStats
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;


    /* Check that the user exists */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Users
        WHERE user_id = @user_id
    )
    BEGIN
        THROW 50050,
              'User does not exist.',
              1;
    END;


    SELECT
        COUNT(*) AS total_donations,

        SUM
        (
            CASE
                WHEN donation_status = N'Completed'
                THEN 1
                ELSE 0
            END
        ) AS completed_donations,

        SUM
        (
            CASE
                WHEN donation_status IN
                (
                    N'Published',
                    N'WaitingForAssociation',
                    N'Accepted',
                    N'PickupScheduled'
                )
                THEN 1
                ELSE 0
            END
        ) AS in_progress_donations,

        SUM
        (
            CASE
                WHEN donation_status = N'Rejected'
                THEN 1
                ELSE 0
            END
        ) AS rejected_donations

    FROM dbo.DonationBags

    WHERE user_id = @user_id;
END
GO
/* =========================================================
   16. Prevent multiple responses to the same donation request
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

        DECLARE @current_status NVARCHAR(50);
        DECLARE @normalized_status NVARCHAR(50);
        DECLARE @bag_status NVARCHAR(50);


        /* Lock the request while checking and updating it */
        SELECT
            @current_status = request_status
        FROM dbo.DonationRequests
            WITH (UPDLOCK, HOLDLOCK)
        WHERE request_id = @request_id;


        /* Check that the request exists */
        IF @current_status IS NULL
        BEGIN
            THROW 50020,
                  'Donation request does not exist.',
                  1;
        END;


        /*
        A request that already received a final response
        cannot be answered again.
        */
        IF UPPER(LTRIM(RTRIM(@current_status))) IN
        (
            N'ACCEPTED',
            N'APPROVED',
            N'REJECTED',
            N'EXPIRED',
            N'CANCELLED',
            N'COMPLETED'
        )
        BEGIN
            THROW 50022,
                  'This donation request has already been answered.',
                  1;
        END;


        SET @normalized_status =
            LTRIM(RTRIM(@new_status));


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
        END;


        /* Update the donation request once */
        UPDATE dbo.DonationRequests
        SET
            request_status = @normalized_status,
            association_response = @association_response,
            response_date = GETDATE()
        WHERE request_id = @request_id;


        /* Update all bags linked to the request */
        UPDATE db
        SET
            db.donation_status = @bag_status
        FROM dbo.DonationBags db
        INNER JOIN dbo.DonationRequestBags drb
            ON db.bag_id = drb.bag_id
        WHERE drb.request_id = @request_id
          AND
          (
              drb.is_active = 1
              OR drb.is_active IS NULL
          );


        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        THROW;

    END CATCH
END
GO