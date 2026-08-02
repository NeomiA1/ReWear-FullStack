-- ============================================================
-- Phase G ROLLBACK
-- Run this ONLY if phase_g_donation_request_transaction.sql was
-- already executed and needs to be undone.
--
-- IMPORTANT: this restores the definition that OBJECT_DEFINITION()
-- showed was ACTUALLY live on Azure immediately before Phase G —
-- NOT the text in phase_d_donation_bag_status.sql. The two are not
-- the same procedure: Azure's live copy never adopted every part of
-- the Phase D rewrite. Confirmed differences, restored here:
--   - RAISERROR (not THROW) for validation failures.
--   - A single combined existence+availability check for the
--     association ('Association does not exist or not available.'),
--     not two separate checks with distinct messages.
--   - No delivery_type validation.
--   - A Notifications INSERT for the association IS present
--     (it was never dropped on Azure, unlike in the Phase D file).
--   - No BEGIN TRANSACTION / UPDLOCK / HOLDLOCK — same as before.
--
-- Parameter signature: the procedure actually pulled from Azure used
-- @contact_phone NVARCHAR(50) / @pickup_address NVARCHAR(250) — NOT
-- NVARCHAR(30)/NVARCHAR(500). This rollback intentionally keeps
-- NVARCHAR(30)/NVARCHAR(500) instead, solely because Phase H's column
-- widths remain in effect and are not touched by this rollback; it is
-- not a claim about what Azure's signature actually was.
--
-- Two details were not part of the reported diff but are kept for
-- functional consistency with what is already established elsewhere
-- in this migration chain:
--   - request_date / request_status are left off the INSERT's column
--     list (same as the original script.sql-era behavior) and fall
--     back to the table's own DEFAULT constraints (GETDATE() /
--     'Pending'), rather than being set explicitly as Phase D does.
--   - is_read / created_at are left off the Notifications INSERT for
--     the same reason, falling back to that table's DEFAULT
--     constraints ((0) / GETDATE()).
--   - The final SELECT CAST(SCOPE_IDENTITY() AS INT) is kept: it must
--     be captured into a variable BEFORE the Notifications INSERT
--     (otherwise SCOPE_IDENTITY() would return the notification's
--     identity, not the donation request's), and DonationRequestDAL.
--     CreateDonationRequest relies on ExecuteScalar() returning this
--     value on every call.
-- ============================================================

CREATE OR ALTER PROCEDURE dbo.sp_CreateDonationRequest
    @user_id INT,
    @association_id INT,
    @delivery_type NVARCHAR(50),
    @contact_phone NVARCHAR(30) = NULL,
    @pickup_address NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE user_id = @user_id)
    BEGIN
        RAISERROR('User does not exist.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Associations
        WHERE association_id = @association_id
          AND is_available = 1
    )
    BEGIN
        RAISERROR('Association does not exist or not available.', 16, 1);
        RETURN;
    END

    INSERT INTO dbo.DonationRequests
    (
        user_id,
        association_id,
        delivery_type,
        contact_phone,
        pickup_address
    )
    VALUES
    (
        @user_id,
        @association_id,
        @delivery_type,
        @contact_phone,
        @pickup_address
    );

    DECLARE @new_donation_request_id INT;
    SET @new_donation_request_id = SCOPE_IDENTITY();

    INSERT INTO dbo.Notifications
    (
        recipient_type,
        recipient_id,
        notification_type,
        related_entity_id,
        message_text
    )
    VALUES
    (
        'Association',
        @association_id,
        'DonationRequest',
        @new_donation_request_id,
        'New donation request from user.'
    );

    SELECT CAST(@new_donation_request_id AS INT);
END
GO
