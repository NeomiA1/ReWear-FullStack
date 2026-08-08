-- ============================================================
-- Phase O ROLLBACK
-- Run this ONLY if phase_o_store_registration.sql was already
-- executed and needs to be undone.
--
-- What this does:
--   1. Drops sp_RegisterStore.
--   2. Drops the filtered unique index and FK added onto
--      SecondHandStores.user_id.
--
-- What this does NOT do:
--   - Drop SecondHandStores.user_id. Confirmed: this column
--     already existed on Azure before Phase O ran — Phase O's
--     migration only added it where missing (IF COL_LENGTH(...)
--     IS NULL), so on this database Phase O never created it.
--     A rollback must only remove what the corresponding
--     migration created, so the column is intentionally left
--     untouched here regardless of whether it holds any
--     Store-linked data.
--   - Touch Users, Associations, Private, or Association data.
--   - Touch sp_CreateStore, sp_CheckStoreExists, or
--     sp_GetNearbyStoresForAssociation.
-- ============================================================

-- Step 1: Drop the new stored procedure.
IF OBJECT_ID('dbo.sp_RegisterStore', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegisterStore;
GO

-- Step 2: Drop the filtered unique index, if present.
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_SecondHandStores_UserId'
      AND object_id = OBJECT_ID('dbo.SecondHandStores')
)
BEGIN
    DROP INDEX UQ_SecondHandStores_UserId ON dbo.SecondHandStores;
END
GO

-- Step 3: Drop the FK, if present.
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_SecondHandStores_Users'
)
BEGIN
    ALTER TABLE dbo.SecondHandStores DROP CONSTRAINT FK_SecondHandStores_Users;
END
GO

-- NOTE: there is deliberately no "Step 4: drop the column" here.
-- SecondHandStores.user_id predates Phase O on this database, so
-- Phase O's migration script never created it (its ALTER TABLE
-- ADD is itself guarded by IF COL_LENGTH(...) IS NULL and was a
-- no-op here) — a rollback must only undo what the migration
-- actually created, so this column is left in place regardless
-- of its contents.
