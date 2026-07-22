namespace RewearApi.BL
{
    public class UserDonationStatsDto
    {
        public int TotalDonations { get; set; }

        public int CompletedDonations { get; set; }

        public int InProgressDonations { get; set; }

        public int RejectedDonations { get; set; }
    }
}