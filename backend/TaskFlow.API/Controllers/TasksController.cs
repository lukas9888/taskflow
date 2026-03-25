using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Model.Entities;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/tasks")]
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
        return Ok(_tasks.GetAll());
    }

    [HttpPost]
    public ActionResult<TaskItem> Create([FromBody] CreateTaskDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var trimmed = body.Title.Trim();
        if (trimmed.Length < 2)
            return BadRequest("Title must be at least 2 characters.");

        var created = _tasks.Create(trimmed);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }
    [HttpDelete("{id}")]
    public ActionResult Delete(int id)
    {
        _tasks.Delete(id);
        return NoContent();
    }
}

public class CreateTaskDto
{
    [Required]
    [MinLength(2)]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
}
