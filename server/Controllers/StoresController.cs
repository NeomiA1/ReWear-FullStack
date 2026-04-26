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