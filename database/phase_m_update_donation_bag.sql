/* =========================================================
   PHASE M - UPDATE DONATION BAG
   עריכת שק תרומה עם בדיקת בעלות וסטטוס
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_UpdateDonationBag
    @bag_id INT,
    @user_id INT,
    @short_description NVARCHAR(500),
    @item_count INT,
    @sizes NVARCHAR(100),
    @target_ages NVARCHAR(100) = NULL,
    @target_gender NVARCHAR(50),
    @clothes_condition NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;


    /* בדיקה שהשק קיים ושייך למשתמש המחובר */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.DonationBags
        WHERE bag_id = @bag_id
          AND user_id = @user_id
    )
    BEGIN
        THROW 50500,
              'Donation bag does not exist or does not belong to the authenticated user.',
              1;
    END;


    /*
    מותר לערוך רק שק שעדיין לא נמצא בתהליך פעיל.
    */
    IF EXISTS
    (
        SELECT 1
        FROM dbo.DonationBags
        WHERE bag_id = @bag_id
          AND user_id = @user_id
          AND donation_status NOT IN
          (
              N'Draft',
              N'Published',
              N'Rejected'
          )
    )
    BEGIN
        THROW 50501,
              'Donation bag cannot be edited in its current status.',
              1;
    END;


    /* כמות פריטים */
    IF @item_count IS NULL
       OR @item_count <= 0
    BEGIN
        THROW 50502,
              'Item count must be greater than zero.',
              1;
    END;


    /* תיאור */
    IF @short_description IS NULL
       OR LEN(
            LTRIM(
                RTRIM(@short_description)
            )
          ) < 5
    BEGIN
        THROW 50503,
              'Donation description must contain at least 5 characters.',
              1;
    END;


    /* מידה */
    IF @sizes IS NULL
       OR LTRIM(RTRIM(@sizes)) = N''
    BEGIN
        THROW 50504,
              'Donation size is required.',
              1;
    END;


    /* קהל יעד */
    IF @target_gender IS NULL
       OR LTRIM(RTRIM(@target_gender)) = N''
    BEGIN
        THROW 50505,
              'Target gender is required.',
              1;
    END;


    /* מצב בגדים */
    IF @clothes_condition IS NULL
       OR LTRIM(
            RTRIM(@clothes_condition)
          ) = N''
    BEGIN
        THROW 50506,
              'Clothes condition is required.',
              1;
    END;


    UPDATE dbo.DonationBags

    SET
        short_description =
            LTRIM(RTRIM(@short_description)),

        item_count =
            @item_count,

        sizes =
            LTRIM(RTRIM(@sizes)),

        target_ages =
            NULLIF(
                LTRIM(RTRIM(@target_ages)),
                N''
            ),

        target_gender =
            LTRIM(RTRIM(@target_gender)),

        clothes_condition =
            LTRIM(RTRIM(@clothes_condition)),

        updated_at =
            SYSDATETIME()

    WHERE bag_id = @bag_id
      AND user_id = @user_id;
END
GO