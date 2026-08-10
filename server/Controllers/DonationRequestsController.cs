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
    public class DonationRequestsController : ControllerBase
    {
        private readonly DonationRequestDAL
            _donationRequestDal =
                new DonationRequestDAL();


        [HttpGet("user/{userId}")]
        public ActionResult<List<UserDonationRequestDto>>
            GetByUser(int userId)
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
        public ActionResult<List<DonationRequestDto>>
            GetByAssociationUser(int userId)
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


        /*
         * פעולה עסקית מאוחדת:
         * יצירת בקשת תרומה + קישור השק לבקשה.
         */
        [HttpPost("submit")]
        public ActionResult SubmitDonationRequest(
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

            /*
             * לא סומכים על userId שמגיע מה-Client.
             */
            request.UserId = currentUserId;
            request.Status = "Pending";

            List<string> errors =
                request.Validate();

            if (errors.Any())
            {
                return BadRequest(new
                {
                    message =
                        "פרטי בקשת התרומה אינם תקינים",

                    errors
                });
            }

            try
            {
                int requestId =
                    _donationRequestDal
                        .SubmitDonationRequest(
                            request
                        );

                return Ok(new
                {
                    requestId,

                    bagId =
                        request.BagId,

                    message =
                        "התרומה נשלחה בהצלחה"
                });
            }
            catch (Exception ex)
            {
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
                            "העמותה שנבחרה אינה קיימת."
                    });
                }

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
                            "העמותה אינה זמינה כרגע לקבלת תרומות."
                    });
                }

                if (
                    ex.Message.Contains(
                        "Donation bag does not exist",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    ex.Message.Contains(
                        "does not belong",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "השק לא נמצא או שאינו שייך למשתמש המחובר."
                    });
                }

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
                            "לא ניתן לשלוח את התרומה. חובה למלא כמות פריטים, תיאור, מידה, קהל יעד, מצב בגדים ולהעלות לפחות תמונה אחת."
                    });
                }

                if (
                    ex.Message.Contains(
                        "already been sent",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "השק כבר נשלח לעמותה."
                    });
                }

                if (
                    ex.Message.Contains(
                        "Delivery type is required",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return BadRequest(new
                    {
                        message =
                            "חובה לבחור צורת מסירה."
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
                        dto.AssociationResponse,
                        dto.CollectionMode
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
                            "בקשת התרומה לא נמצאה."
                    });
                }

                if (
                    ex.Message.Contains(
                        "already been answered",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "הבקשה כבר קיבלה תשובה."
                    });
                }

                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpPost("{requestId}/offer-collection")]
        public ActionResult OfferCollectionToStore(
            int requestId,
            [FromBody] CreateCollaborationRequestDto dto
        )
        {
            if (requestId <= 0)
            {
                return BadRequest(new
                {
                    message = "requestId must be greater than 0"
                });
            }

            if (dto == null || dto.StoreId <= 0)
            {
                return BadRequest(new
                {
                    message = "storeId must be greater than 0"
                });
            }

            int currentAssociationUserId = User.GetCurrentUserId();

            try
            {
                _donationRequestDal.OfferCollectionToStore(
                    requestId,
                    currentAssociationUserId,
                    dto.StoreId
                );

                return Ok(new
                {
                    message = "ההצעה נשלחה לחנות"
                });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "בקשת התרומה לא נמצאה." });
                }

                if (ex.Message.Contains("does not belong", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "בקשת התרומה לא נמצאה." });
                }

                if (ex.Message.Contains("not an active partner", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "החנות שנבחרה אינה שותפה פעילה." });
                }

                if (ex.Message.Contains("already accepted", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(new { message = "חנות כבר אישרה את האיסוף הזה." });
                }

                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpPut("{requestId}/collection-response")]
        public ActionResult RespondToCollectionOffer(
            int requestId,
            [FromBody] CollaborationRequestResponseDto dto
        )
        {
            if (requestId <= 0)
            {
                return BadRequest(new
                {
                    message = "requestId must be greater than 0"
                });
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.NewStatus))
            {
                return BadRequest(new
                {
                    message = "newStatus is required"
                });
            }

            int currentStoreUserId = User.GetCurrentUserId();

            try
            {
                _donationRequestDal.RespondToCollectionOffer(
                    requestId,
                    currentStoreUserId,
                    dto.NewStatus
                );

                return Ok(new
                {
                    message = "התגובה נשמרה בהצלחה"
                });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "הצעת האיסוף לא נמצאה." });
                }

                if (ex.Message.Contains("does not belong", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "הצעת האיסוף לא נמצאה." });
                }

                if (ex.Message.Contains("already been answered", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(new { message = "הצעת האיסוף כבר קיבלה תשובה." });
                }

                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpGet("store/user/{userId}")]
        public ActionResult<List<StoreCollectionOfferDto>> GetCollectionOffersByStore(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new { message = "userId must be greater than 0" });
            }

            int currentUserId = User.GetCurrentUserId();

            if (userId != currentUserId)
            {
                return Forbid();
            }

            try
            {
                List<StoreCollectionOfferDto> offers =
                    _donationRequestDal.GetCollectionOffersByStoreUserId(currentUserId);

                return Ok(offers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}