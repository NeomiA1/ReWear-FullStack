using System;
using System.Security.Claims;

namespace RewearApi.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int GetCurrentUserId(
            this ClaimsPrincipal user
        )
        {
            string? userIdValue =
                user.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (
                string.IsNullOrWhiteSpace(userIdValue)
                || !int.TryParse(
                    userIdValue,
                    out int userId
                )
                || userId <= 0
            )
            {
                throw new UnauthorizedAccessException(
                    "Authenticated user id is missing."
                );
            }

            return userId;
        }
    }
}