/* =========================================================
   PHASE L - DONATION REQUEST OWNERSHIP SECURITY

   1. משתמש יכול לקשר רק בקשה ושקית ששייכות לו.
   2. עמותה יכולה להגיב רק לבקשה שנשלחה אליה.
   3. נשמרות בדיקות ה-Validation וה-Notifications.
   ========================================================= */


/* =========================================================
   1. Secure linking a donation bag to a request
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_LinkBagToDonationRequest
    @request_id INT,
    @bag_id INT,
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @association_id INT;
        DECLARE @request_user_id INT;

        DECLARE @bag_user_id INT;
        DECLARE @current_association_id INT;
        DECLARE @current_status NVARCHAR(50);

        DECLARE @item_count INT;
        DECLARE @short_description NVARCHAR(500);
        DECLARE @sizes NVARCHAR(100);
        DECLARE @clothes_condition NVARCHAR(100);


        /* קבלת פרטי בקשת התרומה */
        SELECT
            @association_id =
                association_id,

            @request_user_id =
                user_id

        FROM dbo.DonationRequests
            WITH (UPDLOCK, HOLDLOCK)

        WHERE request_id = @request_id;


        /* הבקשה אינה קיימת */
        IF @association_id IS NULL
        BEGIN
            THROW 50400,
                  'Donation request does not exist.',
                  1;
        END;


        /* הבקשה אינה שייכת למשתמש המחובר */
        IF @request_user_id <> @user_id
        BEGIN
            THROW 50401,
                  'Donation request does not belong to the authenticated user.',
                  1;
        END;


        /* קבלת פרטי שקית התרומה */
        SELECT
            @bag_user_id =
                user_id,

            @current_association_id =
                assigned_association_id,

            @current_status =
                donation_status,

            @item_count =
                item_count,

            @short_description =
                short_description,

            @sizes =
                sizes,

            @clothes_condition =
                clothes_condition

        FROM dbo.DonationBags
            WITH (UPDLOCK, HOLDLOCK)

        WHERE bag_id = @bag_id;


        /* השקית אינה קיימת */
        IF @bag_user_id IS NULL
        BEGIN
            THROW 50402,
                  'Donation bag does not exist.',
                  1;
        END;


        /* השקית אינה שייכת למשתמש המחובר */
        IF @bag_user_id <> @user_id
        BEGIN
            THROW 50403,
                  'Donation bag does not belong to the authenticated user.',
                  1;
        END;


        /*
        בדיקת השלמת פרטי השקית לפני שליחתה:
        לפחות פריט אחד, תיאור, מידה, מצב בגדים ותמונה.
        */
        IF @item_count IS NULL
           OR @item_count <= 0

           OR @short_description IS NULL
           OR LEN(
                LTRIM(
                    RTRIM(@short_description)
                )
              ) < 5

           OR @sizes IS NULL
           OR LTRIM(RTRIM(@sizes)) = N''

           OR @clothes_condition IS NULL
           OR LTRIM(
                RTRIM(@clothes_condition)
              ) = N''

           OR NOT EXISTS
           (
               SELECT 1
               FROM dbo.BagMedia
               WHERE bag_id = @bag_id
           )
        BEGIN
            THROW 50210,
                  'Donation bag is incomplete.',
                  1;
        END;


        /* השקית כבר מקושרת לבקשה פעילה */
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


        /* בדיקה נוספת לפי סטטוס ושיוך עמותה */
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


        /* קישור השקית לבקשה */
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


        /* עדכון סטטוס ושיוך העמותה */
        UPDATE dbo.DonationBags

        SET
            assigned_association_id =
                @association_id,

            donation_status =
                N'WaitingForAssociation',

            updated_at =
                SYSDATETIME()

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
   2. Secure association response
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_RespondDonationRequest
    @request_id INT,
    @association_user_id INT,
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
        DECLARE @association_id INT;
        DECLARE @owner_association_user_id INT;

        DECLARE @association_name NVARCHAR(200);
        DECLARE @notification_message NVARCHAR(500);


        /*
        נעילת הבקשה וקבלת פרטי המשתמש והעמותה.
        */
        SELECT
            @current_status =
                dr.request_status,

            @request_user_id =
                dr.user_id,

            @association_id =
                dr.association_id,

            @owner_association_user_id =
                a.user_id,

            @association_name =
                a.association_name

        FROM dbo.DonationRequests dr
            WITH (UPDLOCK, HOLDLOCK)

        INNER JOIN dbo.Associations a
            ON dr.association_id =
               a.association_id

        WHERE dr.request_id = @request_id;


        /* הבקשה אינה קיימת */
        IF @current_status IS NULL
        BEGIN
            THROW 50410,
                  'Donation request does not exist.',
                  1;
        END;


        /*
        המשתמש המחובר אינו המשתמש שמנהל את העמותה
        שאליה נשלחה הבקשה.
        */
        IF @owner_association_user_id IS NULL
           OR @owner_association_user_id
              <> @association_user_id
        BEGIN
            THROW 50411,
                  'Donation request does not belong to this association.',
                  1;
        END;


        /*
        לא ניתן להגיב שוב לבקשה שכבר קיבלה
        תשובה סופית.
        */
        IF UPPER(
            LTRIM(
                RTRIM(@current_status)
            )
        ) IN
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


        /* העמותה יכולה רק לאשר או לדחות */
        IF UPPER(@normalized_status) IN
        (
            N'ACCEPTED',
            N'APPROVED'
        )
        BEGIN
            SET @normalized_status =
                N'Accepted';

            SET @bag_status =
                N'Accepted';

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
            SET @normalized_status =
                N'Rejected';

            SET @bag_status =
                N'Rejected';

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


        /* עדכון בקשת התרומה */
        UPDATE dbo.DonationRequests

        SET
            request_status =
                @normalized_status,

            association_response =
                NULLIF(
                    LTRIM(
                        RTRIM(@association_response)
                    ),
                    N''
                ),

            response_date =
                SYSDATETIME()

        WHERE request_id = @request_id
          AND association_id = @association_id;


        /* עדכון כל השקיות הפעילות בבקשה */
        UPDATE db

        SET
            db.donation_status =
                @bag_status,

            db.updated_at =
                SYSDATETIME()

        FROM dbo.DonationBags db

        INNER JOIN dbo.DonationRequestBags drb
            ON db.bag_id =
               drb.bag_id

        WHERE drb.request_id = @request_id
          AND
          (
              drb.is_active = 1
              OR drb.is_active IS NULL
          );


        /* יצירת התראה למשתמש ששלח את הבקשה */
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
            SYSDATETIME()
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