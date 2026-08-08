using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class DonationBag
    {
        public int BagId { get; set; }

        public int UserId { get; set; }

        public string? CreatorName { get; set; }

        public string? ShortDescription { get; set; }
       
        public int ItemCount { get; set; }

        public string? Sizes { get; set; }

        public string? TargetAges { get; set; }

        public string? TargetGender { get; set; }

        public string? ClothesCondition { get; set; }

        public int? AssignedAssociationId { get; set; }

        public string DonationStatus { get; set; } = "Draft";

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }


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
        errors.Add("חובה לבחור משתמש תקין");
    }

    if (ItemCount <= 0)
    {
        errors.Add("חובה להזין לפחות פריט אחד");
    }

    // תיאור הוא שדה רשות: ריק/null/רווחים בלבד תקין. אם כן הוזן תיאור,
    // הוא חייב להכיל לפחות 5 תווים.
    if (!string.IsNullOrWhiteSpace(ShortDescription)
        && ShortDescription.Trim().Length < 5)
    {
        errors.Add("תיאור התרומה חייב להכיל לפחות 5 תווים");
    }

    if (string.IsNullOrWhiteSpace(Sizes))
    {
        errors.Add("חובה להזין מידה");
    }

    if (string.IsNullOrWhiteSpace(ClothesCondition))
    {
        errors.Add("חובה להזין את מצב הבגדים");
    }

    if (string.IsNullOrWhiteSpace(TargetGender))
    {
        errors.Add("חובה לבחור קהל יעד");
    }

    if (!IsValidDonationStatus(DonationStatus))
    {
        errors.Add("סטטוס התרומה אינו תקין");
    }

    return errors;
}
    }
}