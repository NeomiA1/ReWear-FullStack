using System.Collections.Generic;

namespace RewearApi.BL
{
    public class AssociationListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string? City { get; set; }
        public string? Area { get; set; }
        public string DeliveryMode { get; set; } = "";
        public bool IsAvailableDefault { get; set; }
        public string? JoinedAt { get; set; } // ISO-8601 date string
        public string? Types { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        // Populated from AssociationCauses JOIN; empty list = no causes on record.
        public List<string> Causes { get; set; } = new();

        // AcceptedCategories: backed by AssociationCategories (Phase F).
        public List<string> AcceptedCategories { get; set; } = new();

        // CurrentNeeds: no backing source yet — always empty for now.
        public List<string> CurrentNeeds { get; set; } = new();
    }
}
