-- ============================================================
-- Phase H ROLLBACK
-- Run this ONLY if phase_h_donation_request_column_sizes.sql was
-- already executed and needs to be undone.
--
-- Reverts DonationRequests.contact_phone / pickup_address back to
-- their pre-Phase-H Azure types (VARCHAR(20) / VARCHAR(250)).
--
-- WARNING: this is not just a length/truncation concern. NVARCHAR ->
-- VARCHAR is a Unicode -> non-Unicode conversion: any Hebrew (or
-- other non-ASCII) character already stored in these columns will be
-- silently replaced with '?' on conversion, even when the value's
-- length is well within the VARCHAR limit. Length truncation is a
-- second, separate risk on top of that. Both are checked below and
-- the rollback aborts rather than running against live data.
-- ============================================================

-- Abort loudly if either column is missing, instead of finishing
-- silently with no change.
IF NOT EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'contact_phone'
)
BEGIN
    THROW 50110, 'Phase H rollback aborted: DonationRequests.contact_phone column does not exist.', 1;
END
GO

IF NOT EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'pickup_address'
)
BEGIN
    THROW 50111, 'Phase H rollback aborted: DonationRequests.pickup_address column does not exist.', 1;
END
GO

-- Abort if either column already holds non-NULL data. Converting
-- NVARCHAR back to VARCHAR can silently corrupt Hebrew/non-ASCII
-- characters even when every value fits the target length, so this
-- rollback refuses to run against live data instead of risking a
-- silent Unicode loss.
IF EXISTS (SELECT 1 FROM dbo.DonationRequests WHERE contact_phone IS NOT NULL)
BEGIN
    THROW 50112, 'Phase H rollback aborted: DonationRequests.contact_phone has non-NULL data — converting NVARCHAR to VARCHAR risks silent Unicode loss.', 1;
END
GO

IF EXISTS (SELECT 1 FROM dbo.DonationRequests WHERE pickup_address IS NOT NULL)
BEGIN
    THROW 50113, 'Phase H rollback aborted: DonationRequests.pickup_address has non-NULL data — converting NVARCHAR to VARCHAR risks silent Unicode loss.', 1;
END
GO

IF EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'contact_phone'
      AND (DATA_TYPE <> 'varchar' OR CHARACTER_MAXIMUM_LENGTH <> 20)
)
BEGIN
    ALTER TABLE dbo.DonationRequests
    ALTER COLUMN contact_phone VARCHAR(20) NULL;
END
GO

IF EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'pickup_address'
      AND (DATA_TYPE <> 'varchar' OR CHARACTER_MAXIMUM_LENGTH <> 250)
)
BEGIN
    ALTER TABLE dbo.DonationRequests
    ALTER COLUMN pickup_address VARCHAR(250) NULL;
END
GO
