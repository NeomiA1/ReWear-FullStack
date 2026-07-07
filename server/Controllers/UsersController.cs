using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserDAL _userDal = new UserDAL();
        private readonly CauseDAL _causeDal = new CauseDAL();

      [HttpPost("register")]
public ActionResult Register([FromBody] User user)
{
    try
    {
        if (user == null)
        {
            return BadRequest("User object is null");
        }

        var errors = user.Validate();
        if (errors.Any())
        {
            return BadRequest(errors);
        }

        User createdUser = _userDal.RegisterUser(user);

        return Ok(createdUser);
    }
    catch (Exception ex)
    {
        return BadRequest(ex.Message);
    }
}

        [HttpPost("login")]
        public ActionResult Login([FromBody] LoginRequest loginRequest)
        {
            if (loginRequest == null)
            {
                return BadRequest("Login object is null");
            }

            if (string.IsNullOrWhiteSpace(loginRequest.Email) ||
                string.IsNullOrWhiteSpace(loginRequest.Password))
            {
                return BadRequest("Email and password are required");
            }

            User? user = _userDal.LoginUser(loginRequest.Email, loginRequest.Password);

            if (user == null)
            {
                return Unauthorized("Invalid email or password");
            }

            return Ok(user);
        }

        [HttpPatch("{userId}/default-pickup-address")]
        public ActionResult UpdateDefaultPickupAddress(int userId, [FromBody] UpdateDefaultPickupAddressDto dto)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            if (dto == null)
                return BadRequest("Request body is required");

            try
            {
                _userDal.UpdateDefaultPickupAddress(userId, dto.DefaultPickupAddress);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{userId}/causes")]
        public ActionResult SaveUserCauses(int userId, [FromBody] SaveUserCausesDto dto)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            if (dto == null)
                return BadRequest("Request body is required");

            try
            {
                _causeDal.SaveUserCauses(userId, dto.CauseIds ?? new List<string>());
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{userId}/causes")]
        public ActionResult GetUserCauses(int userId)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            try
            {
                List<string> causeIds = _causeDal.GetUserCauses(userId);
                return Ok(causeIds);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }

    public class UpdateDefaultPickupAddressDto
    {
        public string? DefaultPickupAddress { get; set; }
    }

    public class SaveUserCausesDto
    {
        public List<string>? CauseIds { get; set; }
    }
}