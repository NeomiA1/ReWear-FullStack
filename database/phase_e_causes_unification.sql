-- ============================================================
-- Phase E: Unified Causes dictionary
-- Run once against RewearDB on Azure BEFORE deploying backend changes.
--
-- Context (verified directly against Azure before writing this):
--   AssociationCauses has 0 rows.
--   UserCauses has exactly 2 rows, both for user_id 33: 'animals', 'community'.
-- Because there is no real production data at risk, this migration is a
-- simple insert + single-row rename + delete, not a multi-path data
-- migration.
-- ============================================================

BEGIN TRANSACTION;

BEGIN TRY

    -- Step 1: add the new/renamed cause_id rows. youth_at_risk, education,
    -- and animals keep their existing id/label — nothing to do for them.
    -- WHERE NOT EXISTS makes this safe to re-run.
    INSERT INTO Causes (cause_id, label_he)
    SELECT v.cause_id, v.label_he
    FROM (VALUES
        ('families_children',  N'משפחות וילדים'),
        ('elderly_holocaust',  N'קשישים וניצולי שואה'),
        ('health_rehab',       N'בריאות ושיקום'),
        ('women_at_risk',      N'נשים במצבי סיכון'),
        ('community_welfare',  N'קהילה ורווחה'),
        ('soldiers',           N'חיילים ומילואימניקים')
    ) AS v(cause_id, label_he)
    WHERE NOT EXISTS (SELECT 1 FROM Causes c WHERE c.cause_id = v.cause_id);

    -- Step 2: move the one real UserCauses row that points at a
    -- renamed cause_id. AssociationCauses has 0 rows — nothing to migrate there.
    UPDATE UserCauses
    SET cause_id = 'community_welfare'
    WHERE cause_id = 'community';

    -- Step 3: remove the obsolete cause_id rows. Safe now — no
    -- UserCauses/AssociationCauses row references any of them anymore.
    DELETE FROM Causes
    WHERE cause_id IN ('family_support', 'health', 'elderly', 'community', 'environment');

    COMMIT TRANSACTION;

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage  NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT            = ERROR_SEVERITY();
    DECLARE @ErrorState    INT            = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);

END CATCH
GO
