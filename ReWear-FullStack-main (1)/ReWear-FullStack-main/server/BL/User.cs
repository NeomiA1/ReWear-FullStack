using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace RewearApi.BL
{
    public class User
    {
        public int UserId { get; set; }

        public string FullName { get; set; } = "";
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string UserType { get; set; } = "Private";

        public string? Password { get; set; }
        public string PasswordHash { get; set; } = "";

        public string? Phone { get; set; }

        public string? City { get; set; }
        public string? Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public string RegistrationMethod { get; set; } = "Email";

        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; } = true;

        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (string.IsNullOrWhiteSpace(FullName))
                errors.Add("FullName חובה");

            if (string.IsNullOrWhiteSpace(Username))
                errors.Add("Username חובה");

            if (string.IsNullOrWhiteSpace(Email))
                errors.Add("Email חובה");
            else if (!Regex.IsMatch(Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                errors.Add("Email לא תקין");

            if (string.IsNullOrWhiteSpace(UserType))
                errors.Add("UserType חובה");
                
            if (UserType != "Private" && UserType != "Association" && UserType != "Store")
                errors.Add("UserType לא תקין");

            if (string.IsNullOrWhiteSpace(RegistrationMethod))
                errors.Add("RegistrationMethod חובה");

            return errors;
        }
    }
}