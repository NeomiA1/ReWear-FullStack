-- ============================================================
-- Phase U: Association marks a donation as collected
--
-- Run once against RewearDB on Azure. Run BEFORE deploying the
-- corresponding backend change.
--
-- Adds the final step of the donor journey: once the association
-- collects a scheduled pickup, it marks the request as collected.
-- This flips DonationBags.donation_status to 'Completed' (already a
-- legal value -- no schema/constraint change), which is the single
-- field both the donor journey (donationJourney.js) and the impact
-- stats (sp_GetUserDonationStats) already key off. DonationRequests
-- is read-only here (used only for the association-ownership check);
-- request_status is deliberately left untouched to keep this change
-- isolated from the Requests/Pickups screen split shipped earlier.
--
-- Two objects:
--   1. sp_MarkDonationCollected (new)      -- the collection action
--   2. sp_GetDonationRequestsByAssociation -- restated, adds one
--      column (db.donation_status) so OrgPickupsPage can show the
--      collected state after the association clicks the button.
--      Full body restated, identical to the current Azure definition
--      (as of Phase T) except that one added column.
-- ============================================================

-- ------------------------------------------------------------
-- 1. sp_MarkDonationCollected
--
-- Association marks a scheduled pickup as collected. Ownership is
-- checked against the calling association (DonationRequests ->
-- Associations.user_id), mirroring sp_ProposePickupOptions -- this is
-- deliberately NOT the donor-only ownership check used by
-- sp_UpdateDonationBagStatus/DonationBagsController.BelongsToUser,
-- which is untouched and still locks bags after approval.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_MarkDonationCollected
    @request_id INT,
    @association_user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @owner_association_user_id INT;
        DECLARE @request_status NVARCHAR(50);
        DECLARE @selected_day NVARCHAR(20);
        DECLARE @donor_user_id INT;

        SELECT
            @owner_association_user_id = a.user_id,
            @request_status = dr.request_status,
            @selected_day = dr.selected_pickup_day,
            @donor_user_id = dr.user_id
        FROM dbo.DonationRequests dr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Associations a ON dr.association_id = a.association_id
        WHERE dr.request_id = @request_id;

        IF @owner_association_user_id IS NULL
        BEGIN
            THROW 50460, 'Donation request does not exist.', 1;
        END;

        IF @owner_association_user_id <> @association_user_id
        BEGIN
            THROW 50461, 'Donation request does not belong to this association.', 1;
        END;

        IF @request_status <> N'Approved'
        BEGIN
            THROW 50462, 'Donation request must be approved before it can be marked as collected.', 1;
        END;

        IF @selected_day IS NULL
        BEGIN
            THROW 50463, 'A pickup day must be selected before marking the donation as collected.', 1;
        END;

        UPDATE dbo.DonationBags
        SET donation_status = N'Completed'
        WHERE donation_status <> N'Completed'
          AND bag_id IN (
              SELECT drb.bag_id
              FROM dbo.DonationRequestBags drb
              WHERE drb.request_id = @request_id
                AND (drb.is_active = 1 OR drb.is_active IS NULL)
          );

        DECLARE @bags_updated INT = @@ROWCOUNT;

        IF @bags_updated > 0
        BEGIN
            INSERT INTO dbo.Notifications
            (recipient_type, recipient_id, notification_type, related_entity_id, message_text, is_read, created_at)
            VALUES
            (N'User', @donor_user_id, N'DonationCollected', @request_id,
             N'התרומה שלך נאספה בהצלחה. תודה שתרמת/ת!', 0, SYSDATETIME());
        END;

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


-- ------------------------------------------------------------
-- 2. sp_GetDonationRequestsByAssociation -- add donation_status
-- Full body restated, identical to the current Azure definition
-- (as of Phase T) except the one added column (db.donation_status).
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_GetDonationRequestsByAssociation
    @association_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dr.request_id,
        dr.user_id,
        dr.association_id,
        dr.request_date,
        dr.delivery_type,
        dr.request_status,
        dr.association_response,
        dr.response_date,
        dr.collection_mode,
        dr.assigned_store_id,
        s.store_name AS assigned_store_name,
        dr.assignment_status,

        dr.proposed_pickup_days,
        dr.proposed_pickup_times,
        dr.selected_pickup_day,
        dr.selected_pickup_time,

        db.bag_id,
        db.short_description,
        db.sizes,
        db.target_ages,
        db.target_gender,
        db.clothes_condition,
        db.created_at AS bag_created_at,
        db.donation_status,

        u.full_name AS donor_name,
        u.email     AS donor_email,
        u.phone     AS donor_phone

    FROM dbo.DonationRequests dr
    INNER JOIN dbo.DonationRequestBags drb
        ON dr.request_id = drb.request_id
        AND (drb.is_active = 1 OR drb.is_active IS NULL)
    INNER JOIN dbo.DonationBags db
        ON drb.bag_id = db.bag_id
    INNER JOIN dbo.Users u
        ON dr.user_id = u.user_id
    LEFT JOIN dbo.SecondHandStores s
        ON dr.assigned_store_id = s.store_id
    WHERE dr.association_id = @association_id
    ORDER BY dr.request_date DESC;
END
GO
