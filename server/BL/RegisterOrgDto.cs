using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace RewearApi.BL
{
    public class RegisterOrgDto
    {
        // ── User / authentication fields ──────────────────────────────────
        public string FullName  { get; set; } = "";   // contact person name
        public string Email     { get; set; } = "";   // login email + username
        public string Password  { get; set; } = "";   // plain text
        public string? Phone    { get; set; }
        public string? City     { get; set; }

        // ── Association / business fields ─────────────────────────────────
        public string AssociationName { get; set; } = "";
        public string? OrgNumber      { get; set; }   // ח"פ
        public string Address         { get; set; } = "";
        public string WorkMode        { get; set; } = "";
        public string DeliveryMode    { get; set; } = "";

        // Optional donation causes — Phase C. No validation: causes are optional.
        public List<string>? CauseIds { get; set; }

        // ── Column length limits (from real DB schema) ────────────────────
        // Named constants so a schema change is a one-line edit here only.
        private const int MaxEmailLength           = 100;
        private const int MaxAssociationNameLength = 100;
        private const int MaxOrgNumberLength       = 50;
        private const int MaxAddressLength         = 200;
        private const int MaxPhoneLength           = 20;

        // ── Valid enum values (DB CHECK constraints) ──────────────────────
        private static readonly string[] ValidWorkModes     = { "SecondHandStores", "OwnStore", "PhysicalOnly" };
        private static readonly string[] ValidDeliveryModes = { "Pickup", "SelfArrival", "Both" };

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
                // Item 1: format check (was missing in previous version)
                if (!EmailRegex.IsMatch(Email))
                    errors.Add("Email אינו תקין");

                // Item 2: length check against DB column limit
                if (Email.Length > MaxEmailLength)
                    errors.Add($"Email לא יכול להכיל יותר מ-{MaxEmailLength} תווים");
            }

            // ── Password ──────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(Password) || Password.Length < 6)
                errors.Add("Password חייב להכיל לפחות 6 תווים");

            // ── AssociationName ───────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(AssociationName))
            {
                errors.Add("AssociationName חובה");
            }
            else if (AssociationName.Length > MaxAssociationNameLength)
            {
                errors.Add($"AssociationName לא יכול להכיל יותר מ-{MaxAssociationNameLength} תווים");
            }

            // ── OrgNumber (optional field — only length-check if provided) ─
            if (!string.IsNullOrWhiteSpace(OrgNumber) &&
                OrgNumber.Length > MaxOrgNumberLength)
            {
                errors.Add($"OrgNumber לא יכול להכיל יותר מ-{MaxOrgNumberLength} תווים");
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

            // ── WorkMode ──────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(WorkMode) ||
                System.Array.IndexOf(ValidWorkModes, WorkMode) < 0)
                errors.Add("WorkMode חייב להיות SecondHandStores, OwnStore, או PhysicalOnly");

            // ── DeliveryMode ──────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(DeliveryMode) ||
                System.Array.IndexOf(ValidDeliveryModes, DeliveryMode) < 0)
                errors.Add("DeliveryMode חייב להיות Pickup, SelfArrival, או Both");

            return errors;
        }
    }
}