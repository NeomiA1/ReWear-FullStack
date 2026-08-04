/* =========================================================
   PHASE I - NOTIFICATIONS
   Creates notifications and notifies a user when an
   association accepts or rejects a donation request.
   ========================================================= */


/* =========================================================
   1. Create Notifications table
   ========================================================= */

IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications
    (
        notification_id INT IDENTITY(1,1) NOT NULL,

        recipient_type NVARCHAR(30) NOT NULL,

        recipient_id INT NOT NULL,

        notification_type NVARCHAR(50) NOT NULL,

        related_entity_id INT NULL,

        message_text NVARCHAR(500) NOT NULL,

        is_read BIT NOT NULL
            CONSTRAINT DF_Notifications_IsRead
            DEFAULT 0,

        created_at DATETIME2 NOT NULL
            CONSTRAINT DF_Notifications_CreatedAt
            DEFAULT SYSDATETIME(),

        CONSTRAINT PK_Notifications
            PRIMARY KEY (notification_id),

        CONSTRAINT CK_Notifications_RecipientType
            CHECK
            (
                recipient_type IN
                (
                    N'User',
                    N'Association'
                )
            )
    );
END
GO


/* =========================================================
   2. Index for faster notification retrieval
   ========================================================= */

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name =
        N'IX_Notifications_Recipient'
      AND object_id =
        OBJECT_ID(N'dbo.Notifications')
)
BEGIN
    CREATE INDEX IX_Notifications_Recipient
    ON dbo.Notifications
    (
        recipient_type,
        recipient_id,
        created_at DESC
    );
END
GO


/* =========================================================
   3. Get all notifications belonging to a user
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_GetUserNotifications
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @user_id <= 0
    BEGIN
        THROW 50100,
              'User id must be greater than zero.',
              1;
    END;


    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Users
        WHERE user_id = @user_id
    )
    BEGIN
        THROW 50101,
              'User does not exist.',
              1;
    END;


    SELECT
        notification_id,
        recipient_type,
        recipient_id,
        notification_type,
        related_entity_id,
        message_text,
        is_read,
        created_at

    FROM dbo.Notifications

    WHERE recipient_type = N'User'
      AND recipient_id = @user_id

    ORDER BY created_at DESC;
END
GO


/* =========================================================
   4. Get number of unread notifications
   ========================================================= */

CREATE OR ALTER PROCEDURE
    dbo.sp_GetUserUnreadNotificationCount
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @user_id <= 0
    BEGIN
        THROW 50102,
              'User id must be greater than zero.',
              1;
    END;


    SELECT COUNT(*)

    FROM dbo.Notifications

    WHERE recipient_type = N'User'
      AND recipient_id = @user_id
      AND is_read = 0;
END
GO


/* =========================================================
   5. Mark one notification as read
   ========================================================= */

CREATE OR ALTER PROCEDURE
    dbo.sp_MarkNotificationAsRead

    @notification_id INT,
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @notification_id <= 0 OR @user_id <= 0
    BEGIN
        THROW 50103,
              'Notification id and user id must be greater than zero.',
              1;
    END;


    UPDATE dbo.Notifications

    SET is_read = 1

    WHERE notification_id = @notification_id
      AND recipient_type = N'User'
      AND recipient_id = @user_id;


    IF @@ROWCOUNT = 0
    BEGIN
        SELECT CAST(0 AS INT);
        RETURN;
    END;


    SELECT CAST(1 AS INT);
END
GO


/* =========================================================
   6. Update association response procedure
   Creates a notification for the user after a response.
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

        DECLARE @request_user_id INT;
        DECLARE @association_name NVARCHAR(200);
        DECLARE @notification_message NVARCHAR(500);


        /*
        Lock the request while checking and updating it.
        Also get the user who created the request.
        */
        SELECT
            @current_status = dr.request_status,
            @request_user_id = dr.user_id,
            @association_name = a.association_name

        FROM dbo.DonationRequests dr
            WITH (UPDLOCK, HOLDLOCK)

        INNER JOIN dbo.Associations a
            ON dr.association_id =
               a.association_id

        WHERE dr.request_id = @request_id;


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

            SET @notification_message =
                N'העמותה '
                + ISNULL(
                    @association_name,
                    N''
                )
                + N' אישרה את בקשת התרומה שלך.';
        END

        ELSE IF UPPER(@normalized_status) =
            N'REJECTED'
        BEGIN
            SET @normalized_status = N'Rejected';
            SET @bag_status = N'Rejected';

            SET @notification_message =
                N'העמותה '
                + ISNULL(
                    @association_name,
                    N''
                )
                + N' דחתה את בקשת התרומה שלך.';
        END

        ELSE
        BEGIN
            THROW 50021,
                  'Status must be Accepted or Rejected.',
                  1;
        END;


        /* Update the donation request */
        UPDATE dbo.DonationRequests

        SET
            request_status =
                @normalized_status,

            association_response =
                @association_response,

            response_date =
                GETDATE()

        WHERE request_id = @request_id;


        /* Update all bags linked to the request */
        UPDATE db

        SET
            db.donation_status =
                @bag_status

        FROM dbo.DonationBags db

        INNER JOIN dbo.DonationRequestBags drb
            ON db.bag_id = drb.bag_id

        WHERE drb.request_id = @request_id
          AND
          (
              drb.is_active = 1
              OR drb.is_active IS NULL
          );


        /*
        Create notification for the user who submitted
        the donation request.
        */
        INSERT INTO dbo.Notifications
        (
            recipient_type,
            recipient_id,
            notification_type,
            related_entity_id,
            message_text,
            is_read,
            created_at
        )
        VALUES
        (
            N'User',
            @request_user_id,
            N'DonationRequestResponse',
            @request_id,
            @notification_message,
            0,
            GETDATE()
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