namespace TaskFlow.Model.Entities;

public class TaskDependency
{
    public int TaskId { get; set; }
    public int BlockedBy { get; set; }
    public string BlockedByTitle { get; set; } = string.Empty;
}