using System;

namespace RewearApi.BL
{
    public class UserDonationRequestDto
    {
        public int RequestId { get; set; }
        public string RequestStatus { get; set; } = "";
        public DateTime RequestDate { get; set; }
        public string DeliveryType { get; set; } = "";
        public string? AssociationResponse { get; set; }

        public string AssociationName { get; set; } = "";

        public int BagId { get; set; }
        public string? Sizes { get; set; }
        public string? TargetGender { get; set; }
        public string? ClothesCondition { get; set; }
        public string? ShortDescription { get; set; }
    }
}
