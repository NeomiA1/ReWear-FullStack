using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CausesController : ControllerBase
    {
        private readonly CauseDAL _causeDal = new CauseDAL();

        [HttpGet]
        public ActionResult Get()
        {
            try
            {
                List<Cause> causes = _causeDal.GetAllCauses();
                return Ok(causes);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("user/{userId}")]
        public ActionResult<List<string>> GetUserCauses(int userId)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            List<string> causeIds = _causeDal.GetUserCauses(userId);
            return Ok(causeIds);
        }

        [HttpPost("user/{userId}")]
        public ActionResult SaveUserCauses(int userId, [FromBody] List<string> causeIds)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            _causeDal.SaveUserCauses(userId, causeIds ?? new List<string>());
            return Ok("User causes saved successfully");
        }
    }
}
