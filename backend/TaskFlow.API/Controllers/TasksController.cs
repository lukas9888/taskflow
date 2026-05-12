using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Entities;
using TaskFlow.Model.Repositories;
using TaskFlow.API.Helpers;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : AuthorizedControllerBase
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

    [HttpGet("{id:int}")]
    public ActionResult<TaskItem> GetById(int id)
    {
        var userId = GetUserId();
        var task = _tasks.GetById(userId, id);
        return task is null ? NotFound() : Ok(task);
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

        var created = _tasks.Create(
            userId,
            trimmed,
            body.DueAt,
            NormalizePriority(body.Priority),
            TaskFlowNormalization.NormalizeCategory(body.Category),
            NormalizeDescription(body.Description));
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
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

        var updated = _tasks.Update(
            userId,
            id,
            trimmed,
            body.DueAt,
            NormalizePriority(body.Priority),
            TaskFlowNormalization.NormalizeCategory(body.Category),
            NormalizeDescription(body.Description),
            body.Done);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(int id)
    {
        var userId = GetUserId();
        var deleted = _tasks.Delete(userId, id);
        return deleted ? NoContent() : NotFound();
    }

    private static string NormalizePriority(string? p) =>
        p?.ToLowerInvariant() switch
        {
            "high" => "high",
            "low" => "low",
            _ => "medium"
        };

    private static string? NormalizeDescription(string? d)
    {
        if (string.IsNullOrWhiteSpace(d))
            return null;
        var t = d.Trim();
        return t.Length > 8000 ? t[..8000] : t;
    }
}

public class CreateTaskDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset? DueAt { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
}

public class UpdateTaskDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset? DueAt { get; set; }
    public string? Priority { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public bool Done { get; set; }

}
