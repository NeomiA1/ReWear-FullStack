using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RewearApi.BL;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RewearApi.Services
{
    public class JwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(
            IConfiguration configuration
        )
        {
            _configuration = configuration;
        }

        public string CreateToken(User user)
        {
            string? key =
                _configuration["Jwt:Key"];

            string? issuer =
                _configuration["Jwt:Issuer"];

            string? audience =
                _configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "JWT key is missing."
                );
            }

            if (key.Length < 32)
            {
                throw new InvalidOperationException(
                    "JWT key must contain at least 32 characters."
                );
            }

            int expirationMinutes =
                int.TryParse(
                    _configuration[
                        "Jwt:ExpirationMinutes"
                    ],
                    out int parsedMinutes
                )
                    ? parsedMinutes
                    : 120;

            List<Claim> claims =
                new List<Claim>
                {
                    new Claim(
                        JwtRegisteredClaimNames.Sub,
                        user.UserId.ToString()
                    ),

                    new Claim(
                        ClaimTypes.NameIdentifier,
                        user.UserId.ToString()
                    ),

                    new Claim(
                        ClaimTypes.Name,
                        user.Username
                    ),

                    new Claim(
                        ClaimTypes.Email,
                        user.Email
                    ),

                    new Claim(
                        ClaimTypes.Role,
                        user.UserType
                    )
                };

            SymmetricSecurityKey securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key)
                );

            SigningCredentials credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256
                );

            JwtSecurityToken token =
                new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(
                        expirationMinutes
                    ),
                    signingCredentials: credentials
                );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }
}