using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserDAL _userDal =
            new UserDAL();


        [HttpPost("register")]
        public ActionResult Register(
            [FromBody] User user
        )
        {
            if (user == null)
            {
                return BadRequest(
                    "User object is null"
                );
            }

            var errors = user.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                _userDal.RegisterUser(user);

                return Ok(
                    "User registered successfully"
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpPost("login")]
        public ActionResult Login(
            [FromBody] LoginRequest loginRequest
        )
        {
            if (loginRequest == null)
            {
                return BadRequest(
                    "Login object is null"
                );
            }

            if (
                string.IsNullOrWhiteSpace(
                    loginRequest.Email
                )
                ||
                string.IsNullOrWhiteSpace(
                    loginRequest.Password
                )
            )
            {
                return BadRequest(
                    "Email and password are required"
                );
            }

            try
            {
                User? user = _userDal.LoginUser(
                    loginRequest.Email,
                    loginRequest.Password
                );

                if (user == null)
                {
                    return Unauthorized(
                        "Invalid email or password"
                    );
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpGet("{userId}/donation-stats")]
        public ActionResult<UserDonationStatsDto>
            GetDonationStats(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "UserId must be greater than zero"
                });
            }

            try
            {
                UserDonationStatsDto stats =
                    _userDal.GetUserDonationStats(
                        userId
                    );

                return Ok(stats);
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "User does not exist",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "The user does not exist."
                    });
                }

                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}