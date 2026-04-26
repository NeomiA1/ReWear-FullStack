using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class Store
    {
        public int StoreId { get; set; }

        public string StoreName { get; set; } = "";

        public string Address { get; set; } = "";
        public string? City { get; set; }
        public string? Area { get; set; }

        public string Email { get; set; } = "";
        public string? Phone { get; set; }

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; }

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (string.IsNullOrWhiteSpace(StoreName))
                errors.Add("StoreName חובה");

            if (string.IsNullOrWhiteSpace(Address))
                errors.Add("Address חובה");

            if (string.IsNullOrWhiteSpace(Email))
                errors.Add("Email חובה");

            return errors;
        }
    }
}