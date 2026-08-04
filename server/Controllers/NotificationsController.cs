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
    public class NotificationsController : ControllerBase
    {
        private readonly NotificationDAL _notificationDal =
            new NotificationDAL();


        [HttpGet("user/{userId}")]
        public ActionResult<List<Notification>>
            GetByUserId(int userId)
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
                List<Notification> notifications =
                    _notificationDal.GetByUserId(
                        currentUserId
                    );

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpGet("user/{userId}/unread-count")]
        public ActionResult GetUnreadCount(int userId)
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
                int unreadCount =
                    _notificationDal.GetUnreadCount(
                        currentUserId
                    );

                return Ok(new
                {
                    unreadCount
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


        [HttpPut("{notificationId}/read")]
        public ActionResult MarkAsRead(
            int notificationId
        )
        {
            if (notificationId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "notificationId must be greater than 0"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            try
            {
                bool updated =
                    _notificationDal.MarkAsRead(
                        notificationId,
                        currentUserId
                    );

                if (!updated)
                {
                    return NotFound(new
                    {
                        message =
                            "Notification was not found."
                    });
                }

                return Ok(new
                {
                    message =
                        "Notification marked as read"
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
    }
}