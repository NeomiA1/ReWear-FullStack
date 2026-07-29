-- ============================================================
-- Phase E ROLLBACK
-- Run this ONLY if phase_e_causes_unification.sql was already
-- executed and needs to be undone.
-- ============================================================

BEGIN TRANSACTION;

BEGIN TRY

    -- Step 1: restore the original 8 rows.
    INSERT INTO Causes (cause_id, label_he)
    SELECT v.cause_id, v.label_he
    FROM (VALUES
        ('family_support', N'סיוע למשפחות'),
        ('environment',    N'איכות הסביבה'),
        ('youth_at_risk',  N'נוער בסיכון'),
        ('animals',        N'בעלי חיים'),
        ('health',         N'בריאות'),
        ('elderly',        N'קשישים'),
        ('community',      N'רווחה וקהילה'),
        ('education',      N'חינוך')
    ) AS v(cause_id, label_he)
    WHERE NOT EXISTS (SELECT 1 FROM Causes c WHERE c.cause_id = v.cause_id);

    -- Step 2: revert the one real UserCauses row.
    UPDATE UserCauses
    SET cause_id = 'community'
    WHERE cause_id = 'community_welfare';

    -- Step 3: remove the unified-only rows.
    DELETE FROM Causes
    WHERE cause_id IN ('families_children', 'elderly_holocaust', 'health_rehab',
                        'women_at_risk', 'community_welfare', 'soldiers');

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
