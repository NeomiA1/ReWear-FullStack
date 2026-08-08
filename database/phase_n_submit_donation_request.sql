/* =========================================================
   PHASE N - ATOMIC DONATION REQUEST SUBMISSION

   יצירת בקשת תרומה, קישור השק ועדכון הסטטוס
   מתבצעים בתוך Transaction אחד.
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_SubmitDonationRequest

    @user_id INT,
    @bag_id INT,
    @association_id INT,
    @delivery_type NVARCHAR(50),
    @contact_phone NVARCHAR(30) = NULL,
    @pickup_address NVARCHAR(500) = NULL

AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @association_found BIT = 0;
        DECLARE @association_available BIT = 0;

        DECLARE @bag_user_id INT;
        DECLARE @current_association_id INT;
        DECLARE @current_status NVARCHAR(50);

        DECLARE @short_description NVARCHAR(500);
        DECLARE @sizes NVARCHAR(100);
        DECLARE @target_gender NVARCHAR(50);
        DECLARE @clothes_condition NVARCHAR(100);

        DECLARE @new_request_id INT;


        /* ================================================
           1. בדיקת נתוני בסיס
           ================================================ */

        IF @user_id <= 0
        BEGIN
            THROW 50600,
                  'User id must be greater than zero.',
                  1;
        END;


        IF @bag_id <= 0
        BEGIN
            THROW 50601,
                  'Bag id must be greater than zero.',
                  1;
        END;


        IF @association_id <= 0
        BEGIN
            THROW 50602,
                  'Association id must be greater than zero.',
                  1;
        END;


        IF @delivery_type IS NULL
           OR LTRIM(RTRIM(@delivery_type)) = N''
        BEGIN
            THROW 50033,
                  'Delivery type is required.',
                  1;
        END;


        /* ================================================
           2. בדיקת משתמש
           ================================================ */

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


        /* ================================================
           3. נעילת העמותה ובדיקת זמינות
           ================================================ */

        SELECT
            @association_found = 1,
            @association_available = is_available

        FROM dbo.Associations
            WITH (UPDLOCK, HOLDLOCK)

        WHERE association_id = @association_id;


        IF @association_found = 0
        BEGIN
            THROW 50031,
                  'Association does not exist.',
                  1;
        END;


        IF @association_available = 0
        BEGIN
            THROW 50032,
                  'This association is currently unavailable for donations.',
                  1;
        END;


        /* ================================================
           4. נעילת השק וקבלת הנתונים שלו
           ================================================ */

        SELECT
            @bag_user_id =
                user_id,

            @current_association_id =
                assigned_association_id,

            @current_status =
                donation_status,

            @short_description =
                short_description,

            @sizes =
                sizes,

            @target_gender =
                target_gender,

            @clothes_condition =
                clothes_condition

        FROM dbo.DonationBags
            WITH (UPDLOCK, HOLDLOCK)

        WHERE bag_id = @bag_id;


        IF @bag_user_id IS NULL
        BEGIN
            THROW 50402,
                  'Donation bag does not exist.',
                  1;
        END;


        IF @bag_user_id <> @user_id
        BEGIN
            THROW 50403,
                  'Donation bag does not belong to the authenticated user.',
                  1;
        END;


        /* ================================================
           5. Validation עסקי של השק
           ================================================ */

        IF @short_description IS NULL
           OR LEN(
                LTRIM(
                    RTRIM(@short_description)
                )
              ) < 5

           OR @sizes IS NULL
           OR LTRIM(RTRIM(@sizes)) = N''

           OR @target_gender IS NULL
           OR LTRIM(RTRIM(@target_gender)) = N''

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


        /* ================================================
           6. מניעת שליחה כפולה
           ================================================ */

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


        /* ================================================
           7. יצירת בקשת התרומה
           ================================================ */

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
            SYSDATETIME(),
            LTRIM(RTRIM(@delivery_type)),

            NULLIF(
                LTRIM(RTRIM(@contact_phone)),
                N''
            ),

            NULLIF(
                LTRIM(RTRIM(@pickup_address)),
                N''
            ),

            N'Pending'
        );


        SET @new_request_id =
            CONVERT(
                INT,
                SCOPE_IDENTITY()
            );


        /* ================================================
           8. קישור השק לבקשה
           ================================================ */

        INSERT INTO dbo.DonationRequestBags
        (
            request_id,
            bag_id,
            is_active
        )
        VALUES
        (
            @new_request_id,
            @bag_id,
            1
        );


        /* ================================================
           9. עדכון השק
           ================================================ */

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


        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50603,
                  'Donation bag could not be updated.',
                  1;
        END;


        /* ================================================
           10. יצירת התראה לעמותה
           ================================================ */

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
            N'Association',
            @association_id,
            N'DonationRequest',
            @new_request_id,
            N'New donation request from user.',
            0,
            SYSDATETIME()
        );


        COMMIT TRANSACTION;


        /*
         * מוחזר ל-DAL באמצעות ExecuteScalar.
         */
        SELECT @new_request_id;

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