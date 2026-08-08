using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System.Collections.Generic;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StoresController : ControllerBase
    {
        private readonly StoreDAL _storeDal = new StoreDAL();

        // ── New endpoint ─────────────────────────────────────────────────

        [HttpPost("register")]
        public ActionResult<User> RegisterStore([FromBody] RegisterStoreDto dto)
        {
            if (dto == null)
                return BadRequest("Request body is null");

            var errors = dto.Validate();
            if (errors.Any())
                return BadRequest(errors);

            try
            {
                User createdUser = _storeDal.RegisterStore(dto);
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

            if (exceptionMessage.Contains("A store with this email already exists"))
                return "כבר קיימת חנות עם כתובת אימייל זו";

            if (exceptionMessage.Contains("A store with this name already exists"))
                return "כבר קיימת חנות עם שם זה";

            // Fallback — safe generic message, no raw SQL exposed to client.
            return "אירעה שגיאה בתהליך ההרשמה. אנא נסי שוב מאוחר יותר.";
        }

        // ── Existing endpoints — unchanged ───────────────────────────────

        [HttpGet("check")]
        public ActionResult<Store> CheckStoreExists([FromQuery] string storeName, [FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(storeName) || string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("storeName and email are required");
            }

            Store? store = _storeDal.CheckStoreExists(storeName, email);

            if (store == null)
            {
                return NotFound("Store was not found");
            }

            return Ok(store);
        }

        [HttpPost]
        public ActionResult Post([FromBody] Store store)
        {
            if (store == null)
            {
                return BadRequest("Store object is null");
            }

            var errors = store.Validate();
            if (errors.Any())
            {
                return BadRequest(errors);
            }

            _storeDal.CreateStore(store);

            return Ok("Store created successfully");
        }

        [HttpGet("nearby/{associationId}")]
        public ActionResult<List<Store>> GetNearbyStoresForAssociation(int associationId)
        {
            if (associationId <= 0)
            {
                return BadRequest("associationId must be greater than 0");
            }

            List<Store> stores = _storeDal.GetNearbyStoresForAssociation(associationId);
            return Ok(stores);
        }
    }
}