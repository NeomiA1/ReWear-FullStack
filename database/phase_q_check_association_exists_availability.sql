-- ============================================================
-- Phase Q: sp_CheckAssociationExists — return is_available
--
-- Run against RewearDB on Azure BEFORE deploying backend changes.
--
-- Root cause fixed: AssociationDAL.MapAssociation() (used by
-- CheckAssociationExists) reads 13 columns from the reader, but this
-- procedure only ever selected 3 (association_id, association_name,
-- email). The first column MapAssociation touches that isn't in the
-- result set (association_type) throws IndexOutOfRangeException,
-- which propagates unhandled through AssociationsController.
-- CheckAssociationExists (no try/catch there) and comes back to the
-- client as a bare 500 with no CORS headers — indistinguishable from
-- a CORS failure in the browser, but not actually a CORS problem.
--
-- Fix pairs with a backend change that stops calling the full
-- MapAssociation() for this endpoint and instead uses a new
-- lightweight MapAssociationBasic() matching exactly this SELECT
-- list. Verified against every real caller (OrgHomePage.jsx,
-- OrgProfilePage.jsx, ProfilePage.jsx) that the only fields actually
-- read from this endpoint's response are associationId and
-- isAvailable — so is_available is added here, nothing else.
-- ============================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_CheckAssociationExists]
    @association_name NVARCHAR(100),
    @email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT association_id, association_name, email, is_available
    FROM Associations
    WHERE association_name = @association_name
       OR email = @email;
END
