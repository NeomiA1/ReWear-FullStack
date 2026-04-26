using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssociationsController : ControllerBase
    {
        private readonly AssociationDAL _associationDal = new AssociationDAL();

        [HttpGet("check")]
        public ActionResult<Association> CheckAssociationExists([FromQuery] string name, [FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("name and email are required");
            }

            Association? association = _associationDal.CheckAssociationExists(name, email);

            if (association == null)
            {
                return NotFound("Association was not found");
            }

            return Ok(association);
        }

        [HttpPost]
        public ActionResult CreateAssociation([FromBody] Association association)
        {
            if (association == null)
            {
                return BadRequest("Association object is null");
            }

            var errors = association.Validate();
            if (errors.Any())
            {
                return BadRequest(errors);
            }

            _associationDal.CreateAssociation(association);

            return Ok("Association created successfully");
        }

        [HttpPut("{id}")]
        public ActionResult UpdateAssociationSettings(int id, [FromBody] Association association)
        {
            if (association == null)
            {
                return BadRequest("Association object is null");
            }

            if (id != association.AssociationId)
            {
                return BadRequest("Id in URL does not match Association.AssociationId");
            }

            var errors = association.Validate();
            if (errors.Any())
            {
                return BadRequest(errors);
            }

            _associationDal.UpdateAssociationSettings(association);

            return Ok("Association settings updated successfully");
        }

        [HttpPut("{id}/availability")]
        public ActionResult UpdateAssociationAvailability(int id, [FromBody] bool isAvailable)
        {
            if (id <= 0)
            {
                return BadRequest("Association id must be greater than 0");
            }

            _associationDal.UpdateAssociationAvailability(id, isAvailable);

            return Ok("Association availability updated successfully");
        }
    }
}