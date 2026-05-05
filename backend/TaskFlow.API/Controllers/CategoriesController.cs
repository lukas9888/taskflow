using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly CategoryRepository _categories;

    public CategoriesController(CategoryRepository categories)
    {
        _categories = categories;
    }

    [HttpGet]
    public ActionResult<IEnumerable<string>> GetAll()
    {
        var userId = GetUserId();
        return Ok(_categories.GetAllNames(userId));
    }

    private int GetUserId()
    {
        var raw =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrWhiteSpace(raw) || !int.TryParse(raw, out var userId))
            throw new InvalidOperationException("Missing or invalid user id claim.");
        return userId;
    }
}

