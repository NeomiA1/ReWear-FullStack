/* =========================================================
   PHASE J - DONATION BAG BUSINESS VALIDATION

   NOTE: item_count was removed from this feature by business
   decision (treated as an abandoned field, never shipped to
   Azure). The schema-migration section that used to add
   DonationBags.item_count here has been deleted rather than
   fixed forward -- there is nothing to add, and no item_count
   column exists or should exist on Azure.

   UPDATE: sp_CreateDonationBag now also selects back the new
   bag_id (SCOPE_IDENTITY()) so callers can chain the photo
   upload (POST /DonationBags/{bagId}/media) immediately after
   creation. This is a completion of this procedure's original
   contract, not a new phase -- run this file again against
   Azure to pick up the change.
   ========================================================= */


/* =========================================================
   2. Create donation bag with required fields
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_CreateDonationBag
    @user_id INT,
    @short_description NVARCHAR(500),
    @sizes NVARCHAR(100),
    @target_ages NVARCHAR(100) = NULL,
    @target_gender NVARCHAR(50) = NULL,
    @clothes_condition NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;


    /* בדיקה שהמשתמש קיים */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Users
        WHERE user_id = @user_id
    )
    BEGIN
        THROW 50001,
              'User does not exist.',
              1;
    END;


    /* תיאור חובה, לפחות 5 תווים */
    IF @short_description IS NULL
       OR LEN(
            LTRIM(
                RTRIM(@short_description)
            )
          ) < 5
    BEGIN
        THROW 50201,
              'Donation description must contain at least 5 characters.',
              1;
    END;


    /* מידה חובה */
    IF @sizes IS NULL
       OR LTRIM(RTRIM(@sizes)) = N''
    BEGIN
        THROW 50202,
              'Donation size is required.',
              1;
    END;


    /* מצב הבגדים חובה */
    IF @clothes_condition IS NULL
       OR LTRIM(
            RTRIM(@clothes_condition)
          ) = N''
    BEGIN
        THROW 50203,
              'Clothes condition is required.',
              1;
    END;


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
        LTRIM(RTRIM(@short_description)),
        LTRIM(RTRIM(@sizes)),

        NULLIF(
            LTRIM(RTRIM(@target_ages)),
            N''
        ),

        NULLIF(
            LTRIM(RTRIM(@target_gender)),
            N''
        ),

        LTRIM(RTRIM(@clothes_condition)),
        NULL,
        N'Draft'
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS bag_id;
END
GO


/* =========================================================
   3. Get donation bags for a user (with optional size/status
      filters)
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_GetDonationBagsByUserId
    @user_id INT,
    @size NVARCHAR(50) = NULL,
    @status NVARCHAR(50) = NULL
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

      AND
      (
          @size IS NULL
          OR LTRIM(RTRIM(@size)) = N''
          OR db.sizes LIKE
             N'%' + LTRIM(RTRIM(@size)) + N'%'
      )

      AND
      (
          @status IS NULL
          OR LTRIM(RTRIM(@status)) = N''
          OR db.donation_status =
             LTRIM(RTRIM(@status))
      )

    ORDER BY db.created_at DESC;
END
GO


/* =========================================================
   4. Validate bag before sending to association
   ========================================================= */

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

        DECLARE @short_description NVARCHAR(500);
        DECLARE @sizes NVARCHAR(100);
        DECLARE @clothes_condition NVARCHAR(100);


        /* קבלת העמותה מתוך בקשת התרומה */
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


        /* קבלת פרטי השקית */
        SELECT
            @current_association_id =
                assigned_association_id,

            @current_status =
                donation_status,

            @short_description =
                short_description,

            @sizes =
                sizes,

            @clothes_condition =
                clothes_condition

        FROM dbo.DonationBags
            WITH (UPDLOCK, HOLDLOCK)

        WHERE bag_id = @bag_id;


        IF @current_status IS NULL
        BEGIN
            THROW 50011,
                  'Donation bag does not exist.',
                  1;
        END;


        /*
        בדיקות חובה לפני שליחת השקית לעמותה:
        תיאור, מידה, מצב בגדים ותמונה.
        */
        IF @short_description IS NULL
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


        /* בדיקה שהשקית לא כבר משויכת לבקשה פעילה */
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


        /* בדיקה נוספת לפי הסטטוס והעמותה */
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


        /* עדכון השקית */
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