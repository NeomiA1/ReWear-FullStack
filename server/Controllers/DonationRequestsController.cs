using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using RewearApi.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DonationRequestsController :
        ControllerBase
    {
        private readonly DonationRequestDAL
            _donationRequestDal =
                new DonationRequestDAL();


        [HttpGet("user/{userId}")]
        public ActionResult<
            List<UserDonationRequestDto>
        > GetByUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "userId must be greater than 0"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            if (userId != currentUserId)
            {
                return Forbid();
            }

            try
            {
                List<UserDonationRequestDto> requests =
                    _donationRequestDal.GetByUserId(
                        currentUserId
                    );

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpGet("association/user/{userId}")]
        public ActionResult<
            List<DonationRequestDto>
        > GetByAssociationUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "userId must be greater than 0"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            if (userId != currentUserId)
            {
                return Forbid();
            }

            try
            {
                List<DonationRequestDto> requests =
                    _donationRequestDal
                        .GetByAssociationUserId(
                            currentUserId
                        );

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpPost]
        public ActionResult CreateDonationRequest(
            [FromBody] DonationRequest request
        )
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "DonationRequest object is null"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            request.UserId = currentUserId;

            List<string> errors =
                request.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                int requestId =
                    _donationRequestDal
                        .CreateDonationRequest(
                            request
                        );

                return Ok(new
                {
                    requestId,

                    message =
                        "Donation request created successfully"
                });
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "currently unavailable for donations",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "The association is no longer available to receive donations."
                    });
                }

                if (
                    ex.Message.Contains(
                        "Association does not exist",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "The selected association does not exist."
                    });
                }

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
            if (
                requestId <= 0
                || bagId <= 0
            )
            {
                return BadRequest(new
                {
                    message =
                        "requestId and bagId must be greater than 0"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            try
            {
                _donationRequestDal
                    .LinkBagToDonationRequest(
                        requestId,
                        bagId,
                        currentUserId
                    );

                return Ok(new
                {
                    message =
                        "התרומה נשלחה בהצלחה"
                });
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "Donation bag is incomplete",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return BadRequest(new
                    {
                        message =
                            "לא ניתן לשלוח את התרומה. חובה למלא כמות פריטים, תיאור, מידה, מצב בגדים ולהעלות לפחות תמונה אחת."
                    });
                }

                if (
                    ex.Message.Contains(
                        "Donation bag has already been sent",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "Donation bag has already been sent to an association."
                    });
                }

                if (
                    ex.Message.Contains(
                        "does not belong",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "Donation request or donation bag was not found."
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
                return BadRequest(new
                {
                    message =
                        "requestId must be greater than 0"
                });
            }

            if (dto == null)
            {
                return BadRequest(new
                {
                    message =
                        "Response object is null"
                });
            }

            int currentAssociationUserId =
                User.GetCurrentUserId();

            try
            {
                _donationRequestDal
                    .RespondToDonationRequest(
                        requestId,
                        currentAssociationUserId,
                        dto.NewStatus,
                        dto.AssociationResponse
                    );

                return Ok(new
                {
                    message =
                        "תגובת העמותה נשמרה בהצלחה"
                });
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "does not belong",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    ex.Message.Contains(
                        "not associated",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "Donation request was not found."
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