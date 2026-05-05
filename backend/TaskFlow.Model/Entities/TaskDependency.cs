namespace TaskFlow.Model.Entities;

public class TaskDependency
{
    public int TaskId { get; set; }
    public int DependsOn { get; set; }
    public string DependsOnTitle { get; set; } = string.Empty;
}