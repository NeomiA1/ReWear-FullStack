using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System.Collections.Generic;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssociationsController : ControllerBase
    {
        private readonly AssociationDAL _associationDal = new AssociationDAL();

        [HttpGet]
        public ActionResult<List<Association>> GetAllAssociations()
        {
            List<Association> associations = _associationDal.GetAllAssociations();
            return Ok(associations);
        }

        [HttpPost("register")]
        public ActionResult<User> RegisterOrganization([FromBody] RegisterOrgDto dto)
        {
            if (dto == null)
                return BadRequest("Request body is null");

            var errors = dto.Validate();
            if (errors.Any())
                return BadRequest(errors);

            try
            {
                User createdUser = _associationDal.RegisterOrganization(dto);
                return Ok(createdUser);
            }
            
            catch (Exception ex)
            {
                return BadRequest(TranslateRegistrationError(ex.Message));
            }
        }

        
        private static string TranslateRegistrationError(string exceptionMessage)
        {
            if (exceptionMessage.Contains("An account with this email already exists"))
                return "כתובת האימייל כבר קיימת במערכת";

            if (exceptionMessage.Contains("An account with this username already exists"))
                return "שם המשתמש כבר קיים במערכת";

            if (exceptionMessage.Contains("An association with this email already exists"))
                return "כבר קיימת עמותה עם כתובת אימייל זו";

            if (exceptionMessage.Contains("An association with this name already exists"))
                return "כבר קיימת עמותה עם שם זה";

            // Fallback — safe generic message, no raw SQL exposed to client.
            return "אירעה שגיאה בתהליך ההרשמה. אנא נסי שוב מאוחר יותר.";
        }

        // ── Existing endpoints — unchanged ───────────────────────────────

        [HttpGet("check")]
        public ActionResult<Association> CheckAssociationExists(
            [FromQuery] string name,
            [FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
                return BadRequest("name and email are required");

            Association? association = _associationDal.CheckAssociationExists(name, email);

            if (association == null)
                return NotFound("Association was not found");

            return Ok(association);
        }

        [HttpPost]
        public ActionResult CreateAssociation([FromBody] Association association)
        {
            if (association == null)
                return BadRequest("Association object is null");

            var errors = association.Validate();
            if (errors.Any())
                return BadRequest(errors);

            _associationDal.CreateAssociation(association);

            return Ok("Association created successfully");
        }

        [HttpPut("{id}")]
        public ActionResult UpdateAssociationSettings(
            int id,
            [FromBody] Association association)
        {
            if (association == null)
                return BadRequest("Association object is null");

            if (id != association.AssociationId)
                return BadRequest("Id in URL does not match Association.AssociationId");

            var errors = association.Validate();
            if (errors.Any())
                return BadRequest(errors);

            _associationDal.UpdateAssociationSettings(association);

            return Ok("Association settings updated successfully");
        }

        [HttpPut("{id}/availability")]
        public ActionResult UpdateAssociationAvailability(
            int id,
            [FromBody] bool isAvailable)
        {
            if (id <= 0)
                return BadRequest("Association id must be greater than 0");

            _associationDal.UpdateAssociationAvailability(id, isAvailable);

            return Ok("Association availability updated successfully");
        }
    }
}