namespace TaskFlow.Model.Entities;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public string Priority { get; set; } = "medium";
    public string Category { get; set; } = "GENERAL";
    public string? Description { get; set; }
    public bool Done {get; set; }
}
