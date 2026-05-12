using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : AuthorizedControllerBase
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

    [HttpPost]
    public ActionResult<string> Create([FromBody] CreateCategoryDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = GetUserId();
        var name = NormalizeCategory(body.Name);
        if (name is null)
            return BadRequest("Category name cannot be empty.");

        var created = _categories.UpsertName(userId, name);
        return Ok(created);
    }

    private static string? NormalizeCategory(string? c)
    {
        if (string.IsNullOrWhiteSpace(c))
            return null;
        var t = c.Trim().ToUpperInvariant();
        return t.Length > 64 ? t[..64] : t;
    }
}

public class CreateCategoryDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MinLength(1)]
    [System.ComponentModel.DataAnnotations.MaxLength(64)]
    public string Name { get; set; } = string.Empty;
}

