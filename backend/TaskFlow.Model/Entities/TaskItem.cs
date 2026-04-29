namespace TaskFlow.Model.Entities;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DueAt { get; set; }

}
