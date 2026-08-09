using System;

namespace RewearApi.BL
{
    public class AssociationCollaborationRequestDto
    {
        public int CollaborationRequestId { get; set; }
        public int StoreId { get; set; }
        public string StoreName { get; set; } = "";
        public string? StoreCity { get; set; }
        public string? StoreArea { get; set; }
        public string RequestStatus { get; set; } = "";
        public DateTime RequestDate { get; set; }
    }
}
