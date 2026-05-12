using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class DependenciesController : AuthorizedControllerBase
{
    private readonly TaskDependencyRepository _deps;

    public DependenciesController(TaskDependencyRepository deps)
    {
        _deps = deps;
    }

    [HttpGet("dependencies")]
    public ActionResult GetAllForUser()
    {
        var userId = GetUserId();
        var result = _deps.GetAllForUser(userId);
        return Ok(result);
    }

    [HttpPost("{taskId:int}/dependencies")]
    public ActionResult Add(int taskId, [FromBody] AddDependencyDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (body.BlockedById == taskId)
            return BadRequest("A task cannot depend on itself.");

        var userId = GetUserId();
        var added = _deps.AddDependency(userId, taskId, body.BlockedById);

        return added
            ? StatusCode(201)
            : Conflict("Dependency already exists or one of the tasks was not found.");
    }

    [HttpDelete("{taskId:int}/dependencies/{blockedById:int}")]
    public ActionResult Remove(int taskId, int blockedById)
    {
        var userId = GetUserId();
        var removed = _deps.RemoveDependency(userId, taskId, blockedById);
        return removed ? NoContent() : NotFound();
    }
}

public class AddDependencyDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "BlockedById must be a valid task id.")]
    public int BlockedById { get; set; }
}