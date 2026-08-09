using System;

namespace RewearApi.BL
{
    public class StoreCollaborationRequestDto
    {
        public int CollaborationRequestId { get; set; }
        public int AssociationId { get; set; }
        public string AssociationName { get; set; } = "";
        public string? AssociationCity { get; set; }
        public string? AssociationType { get; set; }
        public string RequestStatus { get; set; } = "";
        public DateTime RequestDate { get; set; }
    }
}
