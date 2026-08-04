using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class NotificationDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_GET_USER_NOTIFICATIONS =
            "sp_GetUserNotifications";

        private const string SP_GET_USER_UNREAD_COUNT =
            "sp_GetUserUnreadNotificationCount";

        private const string SP_MARK_NOTIFICATION_AS_READ =
            "sp_MarkNotificationAsRead";


        public List<Notification> GetByUserId(int userId)
        {
            List<Notification> notifications =
                new List<Notification>();

            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@user_id",
                            userId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_GET_USER_NOTIFICATIONS,
                    con,
                    paramDic
                );

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Notification notification =
                            new Notification
                            {
                                NotificationId =
                                    Convert.ToInt32(
                                        reader["notification_id"]
                                    ),

                                RecipientType =
                                    reader["recipient_type"]
                                        .ToString()!,

                                RecipientId =
                                    Convert.ToInt32(
                                        reader["recipient_id"]
                                    ),

                                NotificationType =
                                    reader["notification_type"]
                                        .ToString()!,

                                RelatedEntityId =
                                    reader["related_entity_id"]
                                        == DBNull.Value
                                        ? null
                                        : Convert.ToInt32(
                                            reader["related_entity_id"]
                                        ),

                                MessageText =
                                    reader["message_text"]
                                        .ToString()!,

                                IsRead =
                                    Convert.ToBoolean(
                                        reader["is_read"]
                                    ),

                                CreatedAt =
                                    Convert.ToDateTime(
                                        reader["created_at"]
                                    )
                            };

                        notifications.Add(notification);
                    }
                }
            }

            return notifications;
        }


        public int GetUnreadCount(int userId)
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@user_id",
                            userId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_GET_USER_UNREAD_COUNT,
                    con,
                    paramDic
                );

                object? result = cmd.ExecuteScalar();

                if (result == null || result == DBNull.Value)
                {
                    return 0;
                }

                return Convert.ToInt32(result);
            }
        }


        public bool MarkAsRead(
            int notificationId,
            int userId
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@notification_id",
                            notificationId
                        },
                        {
                            "@user_id",
                            userId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_MARK_NOTIFICATION_AS_READ,
                    con,
                    paramDic
                );

                object? result = cmd.ExecuteScalar();

                if (result == null || result == DBNull.Value)
                {
                    return false;
                }

                return Convert.ToInt32(result) == 1;
            }
        }
    }
}