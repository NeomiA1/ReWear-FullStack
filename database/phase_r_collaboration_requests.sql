-- ============================================================
-- Phase R: Association <-> Store collaboration requests
--
-- Run against RewearDB on Azure BEFORE deploying backend changes.
--
-- Uses the existing AssociationStoreRequests table as-is (no
-- ALTER TABLE, no new columns, no new indexes) -- verified sufficient
-- for create / list / approve-reject / status-tracking:
--   collaboration_request_id (PK identity)
--   association_id  (FK -> Associations.association_id)
--   store_id        (FK -> SecondHandStores.store_id)
--   request_date    (default GETDATE())
--   request_status  (default 'Pending')
--   expiration_date (default DATEADD(day, 14, GETDATE()))
--
-- Four stored procedures, mirroring the existing DonationRequests
-- pattern (sp_SubmitDonationRequest / sp_GetDonationRequestsByAssociation
-- / sp_RespondDonationRequest):
--   sp_CreateCollaborationRequest
--   sp_GetCollaborationRequestsByAssociation
--   sp_GetCollaborationRequestsByStore
--   sp_RespondToCollaborationRequest
--
-- Deliberately excluded (out of scope for this pass): notifications,
-- expiration handling, response_date/response text -- none of these
-- exist for this feature and none are added here.
-- ============================================================

-- ------------------------------------------------------------
-- sp_CreateCollaborationRequest
-- Resolves the association from the authenticated user id (never
-- trusts a client-supplied association id, same principle as
-- sp_RespondDonationRequest's ownership resolution). Blocks a
-- duplicate request to the same store unless the prior one was
-- rejected.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_CreateCollaborationRequest
    @association_user_id INT,
    @store_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @association_id INT;
        DECLARE @new_id INT;

        SELECT @association_id = association_id
        FROM dbo.Associations WITH (UPDLOCK, HOLDLOCK)
        WHERE user_id = @association_user_id;

        IF @association_id IS NULL
        BEGIN
            THROW 51001, 'Association does not exist for the authenticated user.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.SecondHandStores WHERE store_id = @store_id)
        BEGIN
            THROW 51002, 'Store does not exist.', 1;
        END;

        IF EXISTS (
            SELECT 1 FROM dbo.AssociationStoreRequests
            WHERE association_id = @association_id
              AND store_id = @store_id
              AND request_status <> N'Rejected'
        )
        BEGIN
            THROW 51003, 'A collaboration request has already been sent to this store.', 1;
        END;

        INSERT INTO dbo.AssociationStoreRequests (association_id, store_id)
        VALUES (@association_id, @store_id);

        SET @new_id = CONVERT(INT, SCOPE_IDENTITY());

        COMMIT TRANSACTION;

        SELECT @new_id;

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
-- sp_GetCollaborationRequestsByAssociation
-- Association's own sent requests, joined to the store for display.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_GetCollaborationRequestsByAssociation
    @association_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        asr.collaboration_request_id,
        asr.store_id,
        s.store_name,
        s.city   AS store_city,
        s.area   AS store_area,
        asr.request_status,
        asr.request_date
    FROM dbo.AssociationStoreRequests asr
    INNER JOIN dbo.SecondHandStores s
        ON asr.store_id = s.store_id
    WHERE asr.association_id = @association_id
    ORDER BY asr.request_date DESC;
END
GO

-- ------------------------------------------------------------
-- sp_GetCollaborationRequestsByStore
-- Store's incoming requests, joined to the association for display.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_GetCollaborationRequestsByStore
    @store_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        asr.collaboration_request_id,
        asr.association_id,
        a.association_name,
        a.city             AS association_city,
        a.association_type,
        asr.request_status,
        asr.request_date
    FROM dbo.AssociationStoreRequests asr
    INNER JOIN dbo.Associations a
        ON asr.association_id = a.association_id
    WHERE asr.store_id = @store_id
    ORDER BY asr.request_date DESC;
END
GO

-- ------------------------------------------------------------
-- sp_RespondToCollaborationRequest
-- Store approves/rejects. Ownership resolved and locked via
-- SecondHandStores.user_id (same pattern as
-- sp_RespondDonationRequest's Associations.user_id check). Only a
-- currently-Pending request can be answered.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_RespondToCollaborationRequest
    @collaboration_request_id INT,
    @store_user_id INT,
    @new_status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY

        DECLARE @current_status NVARCHAR(50);
        DECLARE @owner_store_user_id INT;
        DECLARE @normalized_status NVARCHAR(50);

        SELECT
            @current_status       = asr.request_status,
            @owner_store_user_id  = s.user_id
        FROM dbo.AssociationStoreRequests asr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.SecondHandStores s
            ON asr.store_id = s.store_id
        WHERE asr.collaboration_request_id = @collaboration_request_id;

        IF @current_status IS NULL
        BEGIN
            THROW 51010, 'Collaboration request does not exist.', 1;
        END;

        IF @owner_store_user_id IS NULL OR @owner_store_user_id <> @store_user_id
        BEGIN
            THROW 51011, 'Collaboration request does not belong to this store.', 1;
        END;

        IF UPPER(LTRIM(RTRIM(@current_status))) <> N'PENDING'
        BEGIN
            THROW 51012, 'This collaboration request has already been answered.', 1;
        END;

        IF UPPER(LTRIM(RTRIM(@new_status))) IN (N'APPROVED', N'ACCEPTED')
        BEGIN
            -- CHK_AssociationStoreRequests_request_status only allows
            -- 'Pending' / 'Accepted' / 'Rejected' / 'Expired' -- not 'Approved'.
            SET @normalized_status = N'Accepted';
        END
        ELSE IF UPPER(LTRIM(RTRIM(@new_status))) = N'REJECTED'
        BEGIN
            SET @normalized_status = N'Rejected';
        END
        ELSE
        BEGIN
            THROW 51013, 'New status must be Approved or Rejected.', 1;
        END;

        UPDATE dbo.AssociationStoreRequests
        SET request_status = @normalized_status
        WHERE collaboration_request_id = @collaboration_request_id;

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
