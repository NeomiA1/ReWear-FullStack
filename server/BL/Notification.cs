using System;

namespace RewearApi.BL
{
    public class Notification
    {
        public int NotificationId { get; set; }

        public string RecipientType { get; set; } = string.Empty;

        public int RecipientId { get; set; }

        public string NotificationType { get; set; } = string.Empty;

        public int? RelatedEntityId { get; set; }

        public string MessageText { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}