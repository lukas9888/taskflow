using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Entities;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly TaskRepository _tasks;

    public TasksController(TaskRepository tasks)
    {
        _tasks = tasks;
    }

    [HttpGet]
    public ActionResult<IEnumerable<TaskItem>> GetAll()
    {
        var userId = GetUserId();
        return Ok(_tasks.GetAll(userId));
    }

    [HttpPost]
    public ActionResult<TaskItem> Create([FromBody] CreateTaskDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var trimmed = body.Title.Trim();
        if (trimmed.Length < 2)
            return BadRequest("Title must be at least 2 characters.");

        var userId = GetUserId();
        if (body.DueAt.HasValue && body.DueAt.Value < DateTimeOffset.UtcNow)
            return BadRequest("Due date cannot be in the past.");

        var created = _tasks.Create(userId, trimmed, body.DueAt);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public ActionResult<TaskItem> Update(int id, [FromBody] UpdateTaskDto body)
    {
    if (!ModelState.IsValid)
        return ValidationProblem(ModelState);

    var trimmed = body.Title.Trim();
    if (trimmed.Length < 2)
        return BadRequest("Title must be at least 2 characters.");

    var userId = GetUserId();
    if (body.DueAt.HasValue && body.DueAt.Value < DateTimeOffset.UtcNow)
        return BadRequest("Due date cannot be in the past.");

    var updated = _tasks.Update(userId, id, trimmed, body.DueAt);
    return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(int id)
    {
        var userId = GetUserId();
        var deleted = _tasks.Delete(userId, id);
        return deleted ? NoContent() : NotFound();
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

public class CreateTaskDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset? DueAt { get; set; }
}

public class UpdateTaskDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset? DueAt { get; set; }
}
