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
    }
}
