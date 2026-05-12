using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Repositories;
using TaskFlow.API.Helpers;

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
        var name = TaskFlowNormalization.NormalizeCategory(body.Name);
        if (name is null)
            return BadRequest("Category name cannot be empty.");

        var created = _categories.UpsertName(userId, name);
        return Ok(created);
    }
}

public class CreateCategoryDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MinLength(1)]
    [System.ComponentModel.DataAnnotations.MaxLength(64)]
    public string Name { get; set; } = string.Empty;
}

