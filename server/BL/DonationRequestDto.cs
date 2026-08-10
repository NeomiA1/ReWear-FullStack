using System;

namespace RewearApi.BL
{
    public class DonationRequestDto
    {
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public int AssociationId { get; set; }

        public DateTime RequestDate { get; set; }
        public string DeliveryType { get; set; } = "";
        public string RequestStatus { get; set; } = "";
        public string? AssociationResponse { get; set; }
        public DateTime? ResponseDate { get; set; }

        public int BagId { get; set; }
        public string? ShortDescription { get; set; }
        public string? Sizes { get; set; }
        public string? TargetAges { get; set; }
        public string? TargetGender { get; set; }
        public string? ClothesCondition { get; set; }
        public DateTime BagCreatedAt { get; set; }

        public string DonorName { get; set; } = "";
        public string DonorEmail { get; set; } = "";
        public string? DonorPhone { get; set; }

        public string? ContactPhone { get; set; }
        public string? PickupAddress { get; set; }

        public string? CollectionMode { get; set; }
        public int? AssignedStoreId { get; set; }
        public string? AssignedStoreName { get; set; }
        public string? AssignmentStatus { get; set; }

        public string? ProposedPickupDays { get; set; }
        public string? ProposedPickupTimes { get; set; }
        public string? SelectedPickupDay { get; set; }
        public string? SelectedPickupTime { get; set; }

        public string? DonationStatus { get; set; }
    }
}
