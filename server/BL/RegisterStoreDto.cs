using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace RewearApi.BL
{
    public class RegisterStoreDto
    {
        // ── User / authentication fields ──────────────────────────────────
        public string FullName  { get; set; } = "";   // contact person name
        public string Email     { get; set; } = "";   // login email + username
        public string Password  { get; set; } = "";   // plain text
        public string? Phone    { get; set; }
        public string? City     { get; set; }

        // ── Store / business fields ─────────────────────────────────────
        public string StoreName   { get; set; } = "";
        public string Address     { get; set; } = "";
        public string? Area       { get; set; }
        public string? Description { get; set; }

        // ── Column length limits (from real DB schema) ────────────────────
        // Named constants so a schema change is a one-line edit here only.
        private const int MaxEmailLength       = 100;
        private const int MaxStoreNameLength   = 100;
        private const int MaxAddressLength     = 200;
        private const int MaxPhoneLength       = 20;
        private const int MaxCityLength        = 100;
        private const int MaxAreaLength        = 100;
        private const int MaxDescriptionLength = 500;

        // Email regex — identical to User.Validate() for consistency.
        private static readonly Regex EmailRegex =
            new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

        public List<string> Validate()
        {
            var errors = new List<string>();

            // ── FullName ──────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(FullName))
                errors.Add("FullName חובה");

            // ── Email ─────────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(Email))
            {
                errors.Add("Email חובה");
            }
            else
            {
                if (!EmailRegex.IsMatch(Email))
                    errors.Add("Email אינו תקין");

                if (Email.Length > MaxEmailLength)
                    errors.Add($"Email לא יכול להכיל יותר מ-{MaxEmailLength} תווים");
            }

            // ── Password ──────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(Password) || Password.Length < 6)
                errors.Add("Password חייב להכיל לפחות 6 תווים");

            // ── StoreName ─────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(StoreName))
            {
                errors.Add("StoreName חובה");
            }
            else if (StoreName.Length > MaxStoreNameLength)
            {
                errors.Add($"StoreName לא יכול להכיל יותר מ-{MaxStoreNameLength} תווים");
            }

            // ── Address ───────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(Address))
            {
                errors.Add("Address חובה");
            }
            else if (Address.Length > MaxAddressLength)
            {
                errors.Add($"Address לא יכול להכיל יותר מ-{MaxAddressLength} תווים");
            }

            // ── Phone (optional field — only length-check if provided) ────
            if (!string.IsNullOrWhiteSpace(Phone) &&
                Phone.Length > MaxPhoneLength)
            {
                errors.Add($"Phone לא יכול להכיל יותר מ-{MaxPhoneLength} תווים");
            }

            // ── City (optional field — only length-check if provided) ─────
            if (!string.IsNullOrWhiteSpace(City) &&
                City.Length > MaxCityLength)
            {
                errors.Add($"City לא יכול להכיל יותר מ-{MaxCityLength} תווים");
            }

            // ── Area (optional field — only length-check if provided) ─────
            if (!string.IsNullOrWhiteSpace(Area) &&
                Area.Length > MaxAreaLength)
            {
                errors.Add($"Area לא יכול להכיל יותר מ-{MaxAreaLength} תווים");
            }

            // ── Description (optional field — only length-check if provided) ─
            if (!string.IsNullOrWhiteSpace(Description) &&
                Description.Length > MaxDescriptionLength)
            {
                errors.Add($"Description לא יכול להכיל יותר מ-{MaxDescriptionLength} תווים");
            }

            return errors;
        }
    }
}
