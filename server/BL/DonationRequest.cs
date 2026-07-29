using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class DonationRequest
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public int BagId { get; set; }
        public int AssociationId { get; set; }
        public string DeliveryMethod { get; set; } = "";
        public string Status { get; set; } = "Pending";

        public string? UserNote { get; set; }
        public string? CharityResponse { get; set; }
        public string? ContactPhone { get; set; }
        public string? PickupAddress { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (UserId <= 0)
                errors.Add("UserId חובה");

            if (BagId <= 0)
                errors.Add("BagId חובה");

            if (AssociationId <= 0)
                errors.Add("AssociationId חובה");

            if (string.IsNullOrWhiteSpace(DeliveryMethod))
                errors.Add("DeliveryMethod חובה");

            if (string.IsNullOrWhiteSpace(Status))
                errors.Add("Status חובה");

            return errors;
        }
    }
}