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

        public DateTime CreatedAt { get; set; }

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (UserId <= 0)
                errors.Add("UserId חובה");

            return errors;
        }
    }
}