using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class DonationBag
    {
        public int BagId { get; set; }

        public int UserId { get; set; }

        public string? ShortDescription { get; set; }

        public string? Sizes { get; set; }

        public string? TargetAges { get; set; }

        public string? TargetGender { get; set; }

        public string? ClothesCondition { get; set; }

        public int? AssignedAssociationId { get; set; }

        public string DonationStatus { get; set; } = "Draft";

        public DateTime CreatedAt { get; set; }


        public static readonly HashSet<string> AllowedDonationStatuses =
            new HashSet<string>
            {
                "Draft",
                "Published",
                "WaitingForAssociation",
                "Accepted",
                "Rejected",
                "PickupScheduled",
                "Completed"
            };


        public static bool IsValidDonationStatus(string? status)
        {
            return !string.IsNullOrWhiteSpace(status)
                   && AllowedDonationStatuses.Contains(status);
        }


        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (UserId <= 0)
            {
                errors.Add("UserId חובה");
            }

            return errors;
        }
    }
}