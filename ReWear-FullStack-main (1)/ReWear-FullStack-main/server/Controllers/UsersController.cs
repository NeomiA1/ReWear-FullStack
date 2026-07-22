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

        _userDal.RegisterUser(user);

        return Ok("User registered successfully");
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
    }
}