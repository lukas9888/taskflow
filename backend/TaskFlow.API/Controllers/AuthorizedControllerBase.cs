using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace TaskFlow.API.Controllers;

public abstract class AuthorizedControllerBase : ControllerBase
{
    protected int GetUserId()
    {
        var raw =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrWhiteSpace(raw) || !int.TryParse(raw, out var userId))
            throw new InvalidOperationException("Missing or invalid user id claim.");
        return userId;
    }
}
