using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System;
using System.Collections.Generic;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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

            try
            {
                List<Notification> notifications =
                    _notificationDal.GetByUserId(userId);

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

            try
            {
                int unreadCount =
                    _notificationDal.GetUnreadCount(userId);

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
            int notificationId,
            [FromQuery] int userId
        )
        {
            if (notificationId <= 0 || userId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "notificationId and userId must be greater than 0"
                });
            }

            try
            {
                bool updated =
                    _notificationDal.MarkAsRead(
                        notificationId,
                        userId
                    );

                if (!updated)
                {
                    return NotFound(new
                    {
                        message =
                            "Notification was not found for this user"
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