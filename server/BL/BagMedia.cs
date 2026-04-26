using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class BagMedia
    {
        public int MediaId { get; set; }
        public int BagId { get; set; }

        public string MediaType { get; set; } = "";
        public string MediaUrl { get; set; } = "";
        public string? MediaDescription { get; set; }

        public DateTime UploadedAt { get; set; }

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (BagId <= 0)
                errors.Add("BagId חובה");

            if (string.IsNullOrWhiteSpace(MediaType))
                errors.Add("MediaType חובה");

            if (string.IsNullOrWhiteSpace(MediaUrl))
                errors.Add("MediaUrl חובה");

            return errors;
        }
    }
}