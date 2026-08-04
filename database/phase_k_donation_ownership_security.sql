/* =========================================================
   PHASE K - DONATION OWNERSHIP SECURITY
   בדיקת בעלות לפני עדכון ומחיקה של שקית תרומה
   ========================================================= */


/* =========================================================
   1. עדכון סטטוס רק על ידי בעל השקית
   ========================================================= */

CREATE OR ALTER PROCEDURE dbo.sp_UpdateDonationBagStatus
    @bag_id INT,
    @user_id INT,
    @donation_status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;


    /* בדיקה שהשקית קיימת ושייכת למשתמש המחובר */
    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.DonationBags
        WHERE bag_id = @bag_id
          AND user_id = @user_id
    )
    BEGIN
        THROW 50300,
              'Donation bag does not exist or does not belong to the authenticated user.',
              1;
    END;


    /* בדיקת סטטוס תקין */
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
        THROW 50301,
              'Invalid donation bag status.',
              1;
    END;


    /* אין שינוי ידני לאחר אישור או השלמת התרומה */
    IF EXISTS
    (
        SELECT 1
        FROM dbo.DonationBags
        WHERE bag_id = @bag_id
          AND user_id = @user_id
          AND donation_status IN
          (
              N'Accepted',
              N'PickupScheduled',
              N'Completed'
          )
    )
    BEGIN
        THROW 50302,
              'Donation bag is locked after approval.',
              1;
    END;


    UPDATE dbo.DonationBags
    SET
        donation_status = @donation_status,
        updated_at = SYSDATETIME()
    WHERE bag_id = @bag_id
      AND user_id = @user_id;
END
GO


/* =========================================================
   2. מחיקת שקית רק על ידי בעל השקית
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

        /* בדיקת בעלות */
        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.DonationBags
            WHERE bag_id = @bag_id
              AND user_id = @user_id
        )
        BEGIN
            THROW 50310,
                  'Donation bag does not exist or does not belong to the authenticated user.',
                  1;
        END;


        /* אי אפשר למחוק תרומה שכבר נמצאת בתהליך פעיל */
        IF EXISTS
        (
            SELECT 1
            FROM dbo.DonationBags
            WHERE bag_id = @bag_id
              AND user_id = @user_id
              AND donation_status IN
              (
                  N'WaitingForAssociation',
                  N'Accepted',
                  N'PickupScheduled',
                  N'Completed'
              )
        )
        BEGIN
            THROW 50311,
                  'Active donation bag cannot be deleted.',
                  1;
        END;


        /* מחיקת המדיה המקושרת */
        DELETE FROM dbo.BagMedia
        WHERE bag_id = @bag_id;


        /* מחיקת קישורים לבקשות תרומה */
        DELETE FROM dbo.DonationRequestBags
        WHERE bag_id = @bag_id;


        /* מחיקת השקית עצמה */
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