-- ============================================================
-- Phase T: Pickup day/time scheduling
-- (Association proposes options -> Donor picks one)
--
-- Run against RewearDB on Azure BEFORE deploying backend changes.
--
-- Schema: 4 new nullable columns on the existing DonationRequests
-- table, no new table -- same pattern already used for the
-- collection-assistance feature (Phase S). No separate status
-- column either: state is derived from the data itself --
--   proposed_pickup_days IS NULL                        -> not proposed yet
--   proposed_pickup_days IS NOT NULL, selected_pickup_day IS NULL -> awaiting donor
--   selected_pickup_day IS NOT NULL                      -> scheduled
-- (evaluated and rejected a third independent status column in the
-- design review -- every state the two new procedures can produce is
-- unambiguous under this derivation, and a status column wouldn't add
-- any safety a data-driven guard clause doesn't already give).
--
-- Storage format: comma-separated NVARCHAR, not JSON. The day/time
-- labels are a small, fixed, developer-controlled vocabulary that
-- never contains a comma, so a CSV format needs no escaping and the
-- client-side .split(",") can never throw (unlike JSON.parse on
-- malformed data).
--
-- Stored procedures:
--   NEW      sp_ProposePickupOptions
--   NEW      sp_SelectPickupOption
--   MODIFIED sp_GetDonationRequestsByAssociation -- +4 columns
--   MODIFIED sp_GetDonationBagsByUserId          -- +request_id +4 columns,
--            via OUTER APPLY (TOP 1 ... ORDER BY), so a bag can never
--            produce more than one output row even if some future
--            change allows multiple DonationRequests per bag -- this
--            is guaranteed by the query's own construction, not by
--            relying on today's dedup logic elsewhere continuing to
--            hold.
-- ============================================================

-- ------------------------------------------------------------
-- Schema
-- ------------------------------------------------------------

ALTER TABLE dbo.DonationRequests ADD
    proposed_pickup_days   NVARCHAR(300) NULL,
    proposed_pickup_times  NVARCHAR(300) NULL,
    selected_pickup_day    NVARCHAR(20)  NULL,
    selected_pickup_time   NVARCHAR(50)  NULL;
GO

-- ------------------------------------------------------------
-- sp_ProposePickupOptions
-- Association proposes a set of pickup days/times for a request
-- that is ready to be scheduled (Self collection, or a Store has
-- already accepted the assisted-collection offer).
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_ProposePickupOptions
    @request_id INT,
    @association_user_id INT,
    @proposed_days NVARCHAR(300),
    @proposed_times NVARCHAR(300)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @owner_association_user_id INT;
        DECLARE @request_status NVARCHAR(50);
        DECLARE @collection_mode NVARCHAR(30);
        DECLARE @assignment_status NVARCHAR(20);

        SELECT
            @owner_association_user_id = a.user_id,
            @request_status = dr.request_status,
            @collection_mode = dr.collection_mode,
            @assignment_status = dr.assignment_status
        FROM dbo.DonationRequests dr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Associations a ON dr.association_id = a.association_id
        WHERE dr.request_id = @request_id;

        IF @owner_association_user_id IS NULL
        BEGIN
            THROW 50440, 'Donation request does not exist.', 1;
        END;

        IF @owner_association_user_id <> @association_user_id
        BEGIN
            THROW 50441, 'Donation request does not belong to this association.', 1;
        END;

        IF @request_status <> N'Approved'
        BEGIN
            THROW 50442, 'Donation request must be approved before proposing pickup options.', 1;
        END;

        IF NOT
        (
            @collection_mode = N'Self'
            OR @assignment_status = N'Accepted'
        )
        BEGIN
            THROW 50443, 'Collection must be self-managed or accepted by a store before proposing pickup options.', 1;
        END;

        IF @proposed_days IS NULL OR LTRIM(RTRIM(@proposed_days)) = N''
           OR @proposed_times IS NULL OR LTRIM(RTRIM(@proposed_times)) = N''
        BEGIN
            THROW 50444, 'At least one proposed day and one proposed time are required.', 1;
        END;

        UPDATE dbo.DonationRequests
        SET
            proposed_pickup_days = LTRIM(RTRIM(@proposed_days)),
            proposed_pickup_times = LTRIM(RTRIM(@proposed_times)),
            selected_pickup_day = NULL,
            selected_pickup_time = NULL
        WHERE request_id = @request_id;

        INSERT INTO dbo.Notifications
        (recipient_type, recipient_id, notification_type, related_entity_id, message_text, is_read, created_at)
        SELECT
            N'User', dr.user_id, N'PickupOptionsProposed', dr.request_id,
            N'העמותה הציעה מועדי איסוף אפשריים לתרומה שלך.', 0, SYSDATETIME()
        FROM dbo.DonationRequests dr
        WHERE dr.request_id = @request_id;

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
-- sp_SelectPickupOption
-- Donor picks exactly one of the proposed day/time combinations.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_SelectPickupOption
    @request_id INT,
    @donor_user_id INT,
    @selected_day NVARCHAR(20),
    @selected_time NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @owner_user_id INT;
        DECLARE @proposed_days NVARCHAR(300);
        DECLARE @proposed_times NVARCHAR(300);
        DECLARE @association_user_id INT;

        SELECT
            @owner_user_id = dr.user_id,
            @proposed_days = dr.proposed_pickup_days,
            @proposed_times = dr.proposed_pickup_times,
            @association_user_id = a.user_id
        FROM dbo.DonationRequests dr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.Associations a ON dr.association_id = a.association_id
        WHERE dr.request_id = @request_id;

        IF @owner_user_id IS NULL
        BEGIN
            THROW 50450, 'Donation request does not exist.', 1;
        END;

        IF @owner_user_id <> @donor_user_id
        BEGIN
            THROW 50451, 'Donation request does not belong to this user.', 1;
        END;

        IF @proposed_days IS NULL OR @proposed_times IS NULL
        BEGIN
            THROW 50452, 'No pickup options have been proposed for this request yet.', 1;
        END;

        IF NOT
        (
            (N',' + @proposed_days + N',') LIKE (N'%,' + @selected_day + N',%')
        )
        BEGIN
            THROW 50453, 'Selected day is not one of the proposed options.', 1;
        END;

        IF NOT
        (
            (N',' + @proposed_times + N',') LIKE (N'%,' + @selected_time + N',%')
        )
        BEGIN
            THROW 50454, 'Selected time is not one of the proposed options.', 1;
        END;

        UPDATE dbo.DonationRequests
        SET
            selected_pickup_day = @selected_day,
            selected_pickup_time = @selected_time
        WHERE request_id = @request_id;

        INSERT INTO dbo.Notifications
        (recipient_type, recipient_id, notification_type, related_entity_id, message_text, is_read, created_at)
        VALUES
        (N'User', @association_user_id, N'PickupOptionSelected', @request_id,
         N'התורם/ת בחר/ה מועד איסוף.', 0, SYSDATETIME());

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
-- sp_GetDonationRequestsByAssociation -- add 4 pickup columns
-- Full body restated, identical to the current Azure definition
-- (as of Phase S) except the 4 new selected columns.
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
-- sp_GetDonationBagsByUserId -- add request_id + 4 pickup columns
-- Full body restated, identical to the current Azure definition
-- except the OUTER APPLY block. TOP 1 ... ORDER BY guarantees at
-- most one matched request per bag by construction, regardless of
-- how many DonationRequestBags rows may exist for that bag now or
-- in the future -- not dependent on the submit-time dedup logic
-- elsewhere continuing to prevent multiple active requests per bag.
-- ------------------------------------------------------------
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
        db.updated_at,

        pickup.request_id,
        pickup.proposed_pickup_days,
        pickup.proposed_pickup_times,
        pickup.selected_pickup_day,
        pickup.selected_pickup_time

    FROM dbo.DonationBags db

    INNER JOIN dbo.Users u
        ON db.user_id = u.user_id

    OUTER APPLY
    (
        SELECT TOP 1
            dr.request_id,
            dr.proposed_pickup_days,
            dr.proposed_pickup_times,
            dr.selected_pickup_day,
            dr.selected_pickup_time
        FROM dbo.DonationRequestBags drb
        INNER JOIN dbo.DonationRequests dr
            ON dr.request_id = drb.request_id
        WHERE drb.bag_id = db.bag_id
          AND (drb.is_active = 1 OR drb.is_active IS NULL)
        ORDER BY dr.request_date DESC
    ) AS pickup

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
