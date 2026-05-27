using System.Collections.Generic;

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

        // Valid enum values from the DB CHECK constraints.
        // Used by Validate() below and documented here for clarity.
        private static readonly string[] ValidWorkModes     = { "SecondHandStores", "OwnStore", "PhysicalOnly" };
        private static readonly string[] ValidDeliveryModes = { "Pickup", "SelfArrival", "Both" };

        public List<string> Validate()
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(FullName))
                errors.Add("FullName חובה");

            if (string.IsNullOrWhiteSpace(Email))
                errors.Add("Email חובה");

            if (string.IsNullOrWhiteSpace(Password) || Password.Length < 6)
                errors.Add("Password חייב להכיל לפחות 6 תווים");

            if (string.IsNullOrWhiteSpace(AssociationName))
                errors.Add("AssociationName חובה");

            if (string.IsNullOrWhiteSpace(Address))
                errors.Add("Address חובה");

            // Validate WorkMode against the exact DB CHECK constraint values.
            // The SP also validates, but checking here gives a cleaner 400
            // response before any DB round-trip happens.
            if (string.IsNullOrWhiteSpace(WorkMode) ||
                System.Array.IndexOf(ValidWorkModes, WorkMode) < 0)
                errors.Add("WorkMode חייב להיות SecondHandStores, OwnStore, או PhysicalOnly");

            if (string.IsNullOrWhiteSpace(DeliveryMode) ||
                System.Array.IndexOf(ValidDeliveryModes, DeliveryMode) < 0)
                errors.Add("DeliveryMode חייב להיות Pickup, SelfArrival, או Both");

            return errors;
        }
    }
}