using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class Association
    {
        public int AssociationId { get; set; }

        public string AssociationName { get; set; } = "";
        public string? AssociationType { get; set; }

        public string Address { get; set; } = "";
        public string? City { get; set; }
        public string? Area { get; set; }

        public string Email { get; set; } = "";
        public string? Phone { get; set; }

        public string? Description { get; set; }
        public string? DonationDestination { get; set; }
        public string? ReceivingHours { get; set; }

        public string WorkMode { get; set; } = "";
        public string DeliveryMode { get; set; } = "";

        public bool IsAvailable { get; set; } = true;

        public List<string> CauseIds { get; set; } = new();

        public DateTime CreatedAt { get; set; }

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (string.IsNullOrWhiteSpace(AssociationName))
                errors.Add("AssociationName חובה");

            if (string.IsNullOrWhiteSpace(Address))
                errors.Add("Address חובה");

            if (string.IsNullOrWhiteSpace(Email))
                errors.Add("Email חובה");

            if (string.IsNullOrWhiteSpace(WorkMode))
                errors.Add("WorkMode חובה");

            if (string.IsNullOrWhiteSpace(DeliveryMode))
                errors.Add("DeliveryMode חובה");

            return errors;
        }
    }
}