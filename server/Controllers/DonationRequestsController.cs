using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System.Collections.Generic;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DonationRequestsController : ControllerBase
    {
        private readonly DonationRequestDAL _donationRequestDal = new DonationRequestDAL();

        [HttpGet("user/{userId}")]
        public ActionResult<List<UserDonationRequestDto>> GetByUser(int userId)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            List<UserDonationRequestDto> requests = _donationRequestDal.GetByUserId(userId);
            return Ok(requests);
        }

        [HttpGet("association/user/{userId}")]
        public ActionResult<List<DonationRequestDto>> GetByAssociationUser(int userId)
        {
            if (userId <= 0)
                return BadRequest("userId must be greater than 0");

            List<DonationRequestDto> requests = _donationRequestDal.GetByAssociationUserId(userId);
            return Ok(requests);
        }

        [HttpPost]
        public ActionResult CreateDonationRequest(
            [FromBody] DonationRequest request
        )
        {
            if (request == null)
            {
                return BadRequest(
                    "DonationRequest object is null"
                );
            }

            var errors = request.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                int requestId =
                    _donationRequestDal
                        .CreateDonationRequest(request);

                return Ok(new
                {
                    requestId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPost("{requestId}/bags/{bagId}")]
        public ActionResult LinkBagToRequest(
            int requestId,
            int bagId
        )
        {
            if (requestId <= 0 || bagId <= 0)
            {
                return BadRequest(
                    "requestId and bagId must be greater than 0"
                );
            }

            try
            {
                _donationRequestDal
                    .LinkBagToDonationRequest(
                        requestId,
                        bagId
                    );

                return Ok(
                    "Bag linked to donation request successfully"
                );
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "Donation bag has already been sent"
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "Donation bag has already been sent to an association."
                    });
                }

                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPut("{requestId}/response")]
        public ActionResult RespondToDonationRequest(
            int requestId,
            [FromBody] DonationRequestResponseDto dto
        )
        {
            if (requestId <= 0)
            {
                return BadRequest(
                    "requestId must be greater than 0"
                );
            }

            if (dto == null)
            {
                return BadRequest(
                    "Response object is null"
                );
            }

            try
            {
                _donationRequestDal
                    .RespondToDonationRequest(
                        requestId,
                        dto.NewStatus,
                        dto.AssociationResponse
                    );

                return Ok(
                    "Donation request response updated successfully"
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
    }
}