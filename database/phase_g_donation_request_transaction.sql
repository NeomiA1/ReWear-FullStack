-- ============================================================
-- Phase G: sp_CreateDonationRequest — atomic availability check
-- Run against RewearDB on Azure BEFORE deploying backend changes.
--
-- Does NOT modify phase_d_donation_bag_status.sql. This is a new
-- CREATE OR ALTER on top of the Phase D definition of
-- sp_CreateDonationRequest (same 5 parameters, same behavior),
-- adding:
--   - BEGIN TRANSACTION + WITH (UPDLOCK, HOLDLOCK) on the
--     Associations row, so is_available cannot change between the
--     check and the INSERT (closes the race window described
--     against the Phase D version — that version ran the check and
--     the INSERT as two separate auto-committed statements).
--   - TRY/CATCH with ROLLBACK, mirroring the pattern already used
--     by sp_LinkBagToDonationRequest / sp_RespondDonationRequest in
--     phase_d_donation_bag_status.sql.
--   - Restores the Notifications INSERT for the association, which
--     existed in the original script.sql definition but was dropped
--     when phase_d rewrote this procedure.
--
-- Error message wording for the "association missing" and
-- "association unavailable" cases is kept byte-for-byte identical to
-- Phase D ('Association does not exist.' / 'This association is
-- currently unavailable for donations.') because
-- DonationRequestsController.CreateDonationRequest matches on these
-- exact substrings (see server/Controllers/DonationRequestsController.cs)
-- to return 404 / 409 instead of a generic 400. Do not reword them
-- without updating the controller.
-- ============================================================

CREATE OR ALTER PROCEDURE dbo.sp_CreateDonationRequest
    @user_id         INT,
    @association_id  INT,
    @delivery_type   NVARCHAR(50),
    @contact_phone   NVARCHAR(30)  = NULL,
    @pickup_address  NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        /* Validate delivery type */
        IF @delivery_type IS NULL OR LTRIM(RTRIM(@delivery_type)) = N''
        BEGIN
            THROW 50033, 'Delivery type is required.', 1;
        END;

        /* Check that the user exists */
        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.Users
            WHERE user_id = @user_id
        )
        BEGIN
            THROW 50030, 'User does not exist.', 1;
        END;

        /* Lock the association row for the lifetime of this transaction
           so a concurrent sp_UpdateAssociationAvailability call cannot
           flip is_available between this check and the INSERT below. */
        DECLARE @association_found     BIT = 0;
        DECLARE @association_available BIT = 0;

        SELECT
            @association_found     = 1,
            @association_available = is_available
        FROM dbo.Associations WITH (UPDLOCK, HOLDLOCK)
        WHERE association_id = @association_id;

        IF @association_found = 0
        BEGIN
            THROW 50031, 'Association does not exist.', 1;
        END;

        IF @association_available = 0
        BEGIN
            THROW 50032, 'This association is currently unavailable for donations.', 1;
        END;

        /* Create the donation request */
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

        DECLARE @new_donation_request_id INT = SCOPE_IDENTITY();

        /* Notify the association of the new request */
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
            @new_donation_request_id,
            N'New donation request from user.',
            0,
            GETDATE()
        );

        COMMIT TRANSACTION;

        /* Return the new request ID to the server (DAL uses ExecuteScalar) */
        SELECT CAST(@new_donation_request_id AS INT);

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH
END
GO
