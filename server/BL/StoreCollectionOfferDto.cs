using System;

namespace RewearApi.BL
{
    public class StoreCollectionOfferDto
    {
        public int RequestId { get; set; }
        public string AssociationName { get; set; } = "";
        public string? AssociationCity { get; set; }
        public string? AssociationType { get; set; }
        public string AssignmentStatus { get; set; } = "";
        public DateTime RequestDate { get; set; }

        public string? ShortDescription { get; set; }
        public string? Sizes { get; set; }
        public string? TargetGender { get; set; }
        public string? ClothesCondition { get; set; }
    }
}
