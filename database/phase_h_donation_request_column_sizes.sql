-- ============================================================
-- Phase H: Align DonationRequests column sizes with
-- sp_CreateDonationRequest's parameters.
--
-- Run against RewearDB on Azure BEFORE deploying backend changes.
-- Run this BEFORE phase_g_donation_request_transaction.sql, and
-- verify it succeeded before running Phase G — Phase G's procedure
-- depends on the column sizes this migration puts in place.
-- Does NOT modify any existing migration file — schema only, no
-- change to sp_CreateDonationRequest itself.
--
-- Problem found on Azure: the live columns are
--   contact_phone   VARCHAR(20)  NULL
--   pickup_address  VARCHAR(250) NULL
-- but sp_CreateDonationRequest (phase_d, and phase_g) declares
--   @contact_phone  NVARCHAR(30)
--   @pickup_address NVARCHAR(500)
-- A value longer than the column's current width would fail on
-- INSERT with "String or binary data would be truncated", and every
-- call pays an implicit VARCHAR<->NVARCHAR conversion. This
-- migration widens both columns to match the procedure's parameters
-- exactly. No other column, constraint, or index is touched.
--
-- Idempotent: each ALTER only runs if the column doesn't already
-- have the target type/length, so re-running this file is safe.
-- ============================================================

-- Abort loudly if either column is missing, instead of finishing
-- silently with no change — a missing column here means the schema
-- assumption this migration (and Phase G) relies on is wrong.
IF NOT EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'contact_phone'
)
BEGIN
    THROW 50100, 'Phase H aborted: DonationRequests.contact_phone column does not exist.', 1;
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
    THROW 50101, 'Phase H aborted: DonationRequests.pickup_address column does not exist.', 1;
END
GO

IF EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'contact_phone'
      AND (DATA_TYPE <> 'nvarchar' OR CHARACTER_MAXIMUM_LENGTH <> 30)
)
BEGIN
    ALTER TABLE dbo.DonationRequests
    ALTER COLUMN contact_phone NVARCHAR(30) NULL;
END
GO

IF EXISTS
(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'DonationRequests'
      AND COLUMN_NAME  = 'pickup_address'
      AND (DATA_TYPE <> 'nvarchar' OR CHARACTER_MAXIMUM_LENGTH <> 500)
)
BEGIN
    ALTER TABLE dbo.DonationRequests
    ALTER COLUMN pickup_address NVARCHAR(500) NULL;
END
GO
