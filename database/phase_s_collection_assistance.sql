-- ============================================================
-- Phase S: Association-assisted collection via partner Stores
-- (sequential single-offer model, no volunteer/broadcast system)
--
-- Run against RewearDB on Azure BEFORE deploying backend changes.
--
-- Schema: 3 new nullable columns on the existing DonationRequests
-- table, no new table (evaluated and rejected a volunteer-list table
-- earlier in this project's design review -- unnecessary once the
-- model is "Association offers to exactly one Store at a time").
--
--   collection_mode    -- 'Self' | 'AssistanceNeeded', set when the
--                          Association responds to the request.
--   assigned_store_id  -- which Store is currently offered/assigned.
--   assignment_status  -- 'Offered' | 'Accepted' | 'Declined', kept
--                          separate from request_status (that column
--                          already means "is the donation approved" --
--                          conflating it with "did the store accept
--                          the pickup" would blur two different
--                          concepts into one column).
--
-- Stored procedures:
--   MODIFIED sp_RespondDonationRequest        -- +@collection_mode
--   MODIFIED sp_GetDonationRequestsByAssociation -- +new columns/join
--   NEW      sp_OfferCollectionToStore
--   NEW      sp_RespondToCollectionOffer
--   NEW      sp_GetCollectionOffersByStore
--
-- Deliberately excluded: expiration jobs, a rejection history table
-- (declining simply reverts assignment_status to NULL-equivalent by
-- being overwritten on the next offer -- no audit trail, a named and
-- accepted trade-off from the design review).
--
-- UPDATE (post first end-to-end test): two UX gaps found --
--   1. sp_RespondToCollectionOffer now also inserts a Notification
--      for the Association's user, reusing the existing recipient_type
--      = 'User' convention (same as sp_RespondDonationRequest) -- the
--      Store's own accept/reject already gets a client-side toast, it
--      only needed a way to tell the Association something happened.
--   2. sp_GetCollectionOffersByStore now also joins DonationBags so
--      the Store can see which bag (description/sizes/gender/
--      condition) the request refers to -- it previously returned
--      only Association info. Re-run this whole file against Azure to
--      pick up both changes.
-- ============================================================

-- ------------------------------------------------------------
-- Schema
-- ------------------------------------------------------------

ALTER TABLE dbo.DonationRequests ADD
    collection_mode    NVARCHAR(30) NULL,
    assigned_store_id  INT NULL,
    assignment_status  NVARCHAR(20) NULL;
GO

ALTER TABLE dbo.DonationRequests
    ADD CONSTRAINT FK_DonationRequests_SecondHandStores
    FOREIGN KEY (assigned_store_id) REFERENCES dbo.SecondHandStores(store_id);
GO

-- ------------------------------------------------------------
-- sp_RespondDonationRequest -- add @collection_mode
-- Full body restated (CREATE OR ALTER), identical to the current
-- Azure definition except the one new parameter and the one new
-- column in the final UPDATE.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_RespondDonationRequest
    @request_id INT,
    @association_user_id INT,
    @new_status NVARCHAR(50),
    @association_response NVARCHAR(500) = NULL,
    @collection_mode NVARCHAR(30) = NULL
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


        SELECT
            @current_status = dr.request_status,
            @request_user_id = dr.user_id,
            @association_id = dr.association_id,
            @owner_association_user_id = a.user_id,
            @association_name = a.association_name
        FROM dbo.DonationRequests dr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Associations a ON dr.association_id = a.association_id
        WHERE dr.request_id = @request_id;

        IF @current_status IS NULL
        BEGIN
            THROW 50410, 'Donation request does not exist.', 1;
        END;

        IF @owner_association_user_id IS NULL OR @owner_association_user_id <> @association_user_id
        BEGIN
            THROW 50411, 'Donation request does not belong to this association.', 1;
        END;

        IF UPPER(LTRIM(RTRIM(@current_status))) IN
        (N'ACCEPTED', N'APPROVED', N'REJECTED', N'EXPIRED', N'CANCELLED', N'COMPLETED')
        BEGIN
            THROW 50022, 'This donation request has already been answered.', 1;
        END;

        SET @normalized_status = LTRIM(RTRIM(@new_status));

        IF UPPER(@normalized_status) IN (N'ACCEPTED', N'APPROVED')
        BEGIN
            SET @normalized_status = N'Approved';
            SET @bag_status = N'Accepted';
            SET @notification_message = N'העמותה ' + ISNULL(@association_name, N'') + N' אישרה את בקשת התרומה שלך.';
        END
        ELSE IF UPPER(@normalized_status) = N'REJECTED'
        BEGIN
            SET @normalized_status = N'Rejected';
            SET @bag_status = N'Rejected';
            SET @notification_message = N'העמותה ' + ISNULL(@association_name, N'') + N' דחתה את בקשת התרומה שלך.';
        END
        ELSE
        BEGIN
            THROW 50021, 'Status must be Accepted or Rejected.', 1;
        END;

        UPDATE dbo.DonationRequests
        SET
            request_status = @normalized_status,
            association_response = NULLIF(LTRIM(RTRIM(@association_response)), N''),
            response_date = SYSDATETIME(),
            collection_mode = @collection_mode
        WHERE request_id = @request_id AND association_id = @association_id;

        UPDATE db
        SET
            db.donation_status = @bag_status,
            db.updated_at = SYSDATETIME()
        FROM dbo.DonationBags db
        INNER JOIN dbo.DonationRequestBags drb ON db.bag_id = drb.bag_id
        WHERE drb.request_id = @request_id
          AND (drb.is_active = 1 OR drb.is_active IS NULL);

        INSERT INTO dbo.Notifications
        (recipient_type, recipient_id, notification_type, related_entity_id, message_text, is_read, created_at)
        VALUES
        (N'User', @request_user_id, N'DonationRequestResponse', @request_id, @notification_message, 0, SYSDATETIME());

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
-- sp_GetDonationRequestsByAssociation -- add new columns + store join
-- Full body restated, identical to the current Azure definition
-- except the 4 new selected columns and the new LEFT JOIN.
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

        db.bag_id,
        db.short_description,
        db.sizes,
        db.target_ages,
        db.target_gender,
        db.clothes_condition,
        db.created_at AS bag_created_at,

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

-- ------------------------------------------------------------
-- sp_OfferCollectionToStore
-- Association offers a specific accepted, assistance-needed request
-- to one active partner Store. Also used to re-offer after a decline
-- (same procedure -- the guard only blocks re-offering while a prior
-- offer is still Accepted, not while it's Declined or unset).
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_OfferCollectionToStore
    @request_id INT,
    @association_user_id INT,
    @store_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @association_id INT;
        DECLARE @owner_association_user_id INT;
        DECLARE @request_status NVARCHAR(50);
        DECLARE @collection_mode NVARCHAR(30);
        DECLARE @current_assignment_status NVARCHAR(20);

        SELECT
            @association_id = dr.association_id,
            @owner_association_user_id = a.user_id,
            @request_status = dr.request_status,
            @collection_mode = dr.collection_mode,
            @current_assignment_status = dr.assignment_status
        FROM dbo.DonationRequests dr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Associations a ON dr.association_id = a.association_id
        WHERE dr.request_id = @request_id;

        IF @association_id IS NULL
        BEGIN
            THROW 50420, 'Donation request does not exist.', 1;
        END;

        IF @owner_association_user_id IS NULL OR @owner_association_user_id <> @association_user_id
        BEGIN
            THROW 50421, 'Donation request does not belong to this association.', 1;
        END;

        IF @request_status <> N'Approved'
        BEGIN
            THROW 50422, 'Donation request must be accepted before offering collection.', 1;
        END;

        IF @collection_mode <> N'AssistanceNeeded'
        BEGIN
            THROW 50423, 'Collection assistance was not requested for this donation.', 1;
        END;

        IF @current_assignment_status = N'Accepted'
        BEGIN
            THROW 50424, 'A store has already accepted this collection.', 1;
        END;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.AssociationStoreRequests
            WHERE association_id = @association_id
              AND store_id = @store_id
              AND request_status = N'Accepted'
        )
        BEGIN
            THROW 50425, 'Store is not an active partner of this association.', 1;
        END;

        UPDATE dbo.DonationRequests
        SET
            assigned_store_id = @store_id,
            assignment_status = N'Offered'
        WHERE request_id = @request_id;

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
-- sp_RespondToCollectionOffer
-- Store accepts/declines the offer currently addressed to it.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_RespondToCollectionOffer
    @request_id INT,
    @store_user_id INT,
    @new_status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @assigned_store_id INT;
        DECLARE @owner_store_user_id INT;
        DECLARE @current_assignment_status NVARCHAR(20);
        DECLARE @normalized_status NVARCHAR(20);

        DECLARE @association_user_id INT;
        DECLARE @store_name NVARCHAR(200);
        DECLARE @notification_message NVARCHAR(500);

        SELECT
            @assigned_store_id = dr.assigned_store_id,
            @current_assignment_status = dr.assignment_status,
            @association_user_id = a.user_id
        FROM dbo.DonationRequests dr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Associations a ON dr.association_id = a.association_id
        WHERE dr.request_id = @request_id;

        IF @assigned_store_id IS NULL
        BEGIN
            THROW 50430, 'No collection offer exists for this donation request.', 1;
        END;

        SELECT
            @owner_store_user_id = user_id,
            @store_name = store_name
        FROM dbo.SecondHandStores
        WHERE store_id = @assigned_store_id;

        IF @owner_store_user_id IS NULL OR @owner_store_user_id <> @store_user_id
        BEGIN
            THROW 50431, 'This collection offer does not belong to this store.', 1;
        END;

        IF @current_assignment_status <> N'Offered'
        BEGIN
            THROW 50432, 'This collection offer has already been answered.', 1;
        END;

        IF UPPER(LTRIM(RTRIM(@new_status))) IN (N'APPROVED', N'ACCEPTED')
        BEGIN
            SET @normalized_status = N'Accepted';
            SET @notification_message = N'החנות ' + ISNULL(@store_name, N'') + N' אישרה את בקשת הסיוע באיסוף.';
        END
        ELSE IF UPPER(LTRIM(RTRIM(@new_status))) = N'REJECTED'
        BEGIN
            SET @normalized_status = N'Declined';
            SET @notification_message = N'החנות ' + ISNULL(@store_name, N'') + N' דחתה את בקשת הסיוע באיסוף.';
        END
        ELSE
        BEGIN
            THROW 50433, 'New status must be Approved or Rejected.', 1;
        END;

        UPDATE dbo.DonationRequests
        SET assignment_status = @normalized_status
        WHERE request_id = @request_id;

        INSERT INTO dbo.Notifications
        (recipient_type, recipient_id, notification_type, related_entity_id, message_text, is_read, created_at)
        VALUES
        (N'User', @association_user_id, N'CollectionOfferResponse', @request_id, @notification_message, 0, SYSDATETIME());

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
-- sp_GetCollectionOffersByStore
-- Store's list of requests offered/assigned to it (any assignment
-- status) -- powers the "Collection Assistance Requests" tab.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_GetCollectionOffersByStore
    @store_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dr.request_id,
        a.association_name,
        a.city AS association_city,
        a.association_type,
        dr.assignment_status,
        dr.request_date,

        db.short_description,
        db.sizes,
        db.target_gender,
        db.clothes_condition

    FROM dbo.DonationRequests dr
    INNER JOIN dbo.Associations a
        ON dr.association_id = a.association_id
    INNER JOIN dbo.DonationRequestBags drb
        ON dr.request_id = drb.request_id
        AND (drb.is_active = 1 OR drb.is_active IS NULL)
    INNER JOIN dbo.DonationBags db
        ON drb.bag_id = db.bag_id
    WHERE dr.assigned_store_id = @store_id
    ORDER BY dr.request_date DESC;
END
GO
