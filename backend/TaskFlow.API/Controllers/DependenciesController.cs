using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class DependenciesController : ControllerBase
{
    private readonly TaskDependencyRepository _deps;

    public DependenciesController(TaskDependencyRepository deps)
    {
        _deps = deps;
    }

    // GET /api/tasks/dependencies
    [HttpGet("dependencies")]
    public ActionResult GetAllForUser()
    {
        var userId = GetUserId();
        var result = _deps.GetAllForUser(userId);
        return Ok(result);
    }

    // GET /api/tasks/{taskId}/dependencies
    [HttpGet("{taskId:int}/dependencies")]
    public ActionResult GetAll(int taskId)
    {
        var userId = GetUserId();
        var result = _deps.GetDependencies(userId, taskId);
        return Ok(result);
    }

    // POST /api/tasks/{taskId}/dependencies
    [HttpPost("{taskId:int}/dependencies")]
    public ActionResult Add(int taskId, [FromBody] AddDependencyDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (body.DependsOnId == taskId)
            return BadRequest("A task cannot depend on itself.");

        var userId = GetUserId();
        var added = _deps.AddDependency(userId, taskId, body.DependsOnId);

        return added
            ? StatusCode(201)
            : Conflict("Dependency already exists or one of the tasks was not found.");
    }

    // DELETE /api/tasks/{taskId}/dependencies/{dependsOnId}
    [HttpDelete("{taskId:int}/dependencies/{dependsOnId:int}")]
    public ActionResult Remove(int taskId, int dependsOnId)
    {
        var userId = GetUserId();
        var removed = _deps.RemoveDependency(userId, taskId, dependsOnId);
        return removed ? NoContent() : NotFound();
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

public class AddDependencyDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "DependsOnId must be a valid task id.")]
    public int DependsOnId { get; set; }
}