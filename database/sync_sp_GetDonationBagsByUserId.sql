-- ============================================================
-- Sync patch: sp_GetDonationBagsByUserId
--
-- NOT a numbered phase_x migration. This is a standalone hotfix
-- that brings the live Azure definition of sp_GetDonationBagsByUserId
-- back in sync with the canonical definition in
-- database/phase_j_business_validation.sql, now that item_count
-- has been removed from the product as an abandoned feature
-- (business decision -- see the accompanying cleanup commit).
--
-- This procedure now matches the current backend exactly:
--   - server/DAL/DonationBagDAL.cs (GetDonationBagsByUserId) sends
--     @user_id, @size, @status and reads exactly these 12 columns
--     from the result set: bag_id, user_id, creator_name,
--     short_description, sizes, target_ages, target_gender,
--     clothes_condition, assigned_association_id, donation_status,
--     created_at, updated_at. item_count is no longer read.
--   - server/Controllers/DonationBagsController.cs's
--     GetDonationBagsByUserId action still accepts [FromQuery] size
--     and status and passes them straight through -- filtering is
--     unaffected by the item_count removal.
--   - server/BL/DonationBag.cs no longer has an ItemCount property.
--
-- This file contains only the one CREATE OR ALTER PROCEDURE
-- statement; no other object is created, altered, or dropped. In
-- particular, this does NOT add DonationBags.item_count -- that
-- column does not and should not exist on Azure.
--
-- Run once against RewearDB on Azure, manually via SSMS.
-- ============================================================

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
        db.updated_at

    FROM dbo.DonationBags db

    INNER JOIN dbo.Users u
        ON db.user_id = u.user_id

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
