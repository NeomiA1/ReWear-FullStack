using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using RewearApi.Extensions;
using System;
using System.Collections.Generic;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CollaborationRequestsController : ControllerBase
    {
        private readonly CollaborationRequestDAL _collaborationRequestDal =
            new CollaborationRequestDAL();


        [HttpPost]
        public ActionResult CreateCollaborationRequest(
            [FromBody] CreateCollaborationRequestDto dto)
        {
            if (dto == null || dto.StoreId <= 0)
            {
                return BadRequest(new
                {
                    message = "storeId must be greater than 0"
                });
            }

            int currentUserId = User.GetCurrentUserId();

            try
            {
                int collaborationRequestId =
                    _collaborationRequestDal.CreateCollaborationRequest(
                        currentUserId,
                        dto.StoreId
                    );

                return Ok(new
                {
                    collaborationRequestId,
                    message = "בקשת שיתוף הפעולה נשלחה בהצלחה"
                });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("Association does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "לא נמצאה עמותה עבור המשתמש המחובר." });
                }

                if (ex.Message.Contains("Store does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "החנות שנבחרה אינה קיימת." });
                }

                if (ex.Message.Contains("already been sent", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(new { message = "כבר נשלחה בקשת שיתוף פעולה לחנות זו." });
                }

                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpGet("association/user/{userId}")]
        public ActionResult<List<AssociationCollaborationRequestDto>> GetByAssociationUser(int userId)
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
                List<AssociationCollaborationRequestDto> requests =
                    _collaborationRequestDal.GetByAssociationUserId(currentUserId);

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpGet("store/user/{userId}")]
        public ActionResult<List<StoreCollaborationRequestDto>> GetByStoreUser(int userId)
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
                List<StoreCollaborationRequestDto> requests =
                    _collaborationRequestDal.GetByStoreUserId(currentUserId);

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpPut("{collaborationRequestId}/response")]
        public ActionResult RespondToCollaborationRequest(
            int collaborationRequestId,
            [FromBody] CollaborationRequestResponseDto dto)
        {
            if (collaborationRequestId <= 0)
            {
                return BadRequest(new { message = "collaborationRequestId must be greater than 0" });
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.NewStatus))
            {
                return BadRequest(new { message = "newStatus is required" });
            }

            int currentStoreUserId = User.GetCurrentUserId();

            try
            {
                _collaborationRequestDal.RespondToCollaborationRequest(
                    collaborationRequestId,
                    currentStoreUserId,
                    dto.NewStatus
                );

                return Ok(new { message = "התגובה נשמרה בהצלחה" });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "בקשת שיתוף הפעולה לא נמצאה." });
                }

                if (ex.Message.Contains("does not belong", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { message = "בקשת שיתוף הפעולה לא נמצאה." });
                }

                if (ex.Message.Contains("already been answered", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(new { message = "הבקשה כבר קיבלה תשובה." });
                }

                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
