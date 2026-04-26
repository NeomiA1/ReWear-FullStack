using System;
using System.Collections.Generic;

namespace RewearApi.BL
{
    public class AssociationStoreRequest
    {
        public int CollaborationRequestId { get; set; }
        public int AssociationId { get; set; }
        public int StoreId { get; set; }

        public DateTime RequestDate { get; set; }
        public string RequestStatus { get; set; } = "Pending";
        public DateTime ExpirationDate { get; set; }

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (AssociationId <= 0)
                errors.Add("AssociationId חובה");

            if (StoreId <= 0)
                errors.Add("StoreId חובה");

            if (string.IsNullOrWhiteSpace(RequestStatus))
                errors.Add("RequestStatus חובה");

            return errors;
        }
    }
}