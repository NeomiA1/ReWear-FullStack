-- ============================================================
-- Phase B: Donation value preferences (Causes / UserCauses)
-- Run once against RewearDB on Azure.
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

IF OBJECT_ID('dbo.Causes', 'U') IS NULL
BEGIN
    CREATE TABLE Causes (
        cause_id  VARCHAR(50)   NOT NULL PRIMARY KEY,
        label_he  NVARCHAR(100) NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.UserCauses', 'U') IS NULL
BEGIN
    CREATE TABLE UserCauses (
        user_id   INT          NOT NULL FOREIGN KEY REFERENCES Users(user_id),
        cause_id  VARCHAR(50)  NOT NULL FOREIGN KEY REFERENCES Causes(cause_id),
        CONSTRAINT PK_UserCauses PRIMARY KEY (user_id, cause_id)
    );
END
GO

-- ------------------------------------------------------------
-- Seed data (idempotent)
-- ------------------------------------------------------------

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
GO

-- ------------------------------------------------------------
-- sp_GetAllCauses: full catalog
-- ------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[sp_GetAllCauses]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT cause_id, label_he
    FROM Causes;
END;
GO

-- ------------------------------------------------------------
-- sp_SaveUserCauses: replace-all via CSV transport.
-- Inserts only cause_ids that exist in Causes (JOIN guards FK).
-- ------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[sp_SaveUserCauses]
    @user_id        INT,
    @cause_ids_csv  NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM UserCauses WHERE user_id = @user_id;

    INSERT INTO UserCauses (user_id, cause_id)
    SELECT DISTINCT @user_id, c.cause_id
    FROM STRING_SPLIT(@cause_ids_csv, ',') s
    INNER JOIN Causes c
        ON c.cause_id = LTRIM(RTRIM(s.value))
    WHERE LTRIM(RTRIM(s.value)) <> '';
END;
GO

-- ------------------------------------------------------------
-- sp_GetUserCauses: cause_ids selected by a user
-- ------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[sp_GetUserCauses]
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT cause_id
    FROM UserCauses
    WHERE user_id = @user_id;
END;
GO
