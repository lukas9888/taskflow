using Microsoft.Extensions.Configuration;
using Npgsql;
using TaskFlow.Model.Entities;

namespace TaskFlow.Model.Repositories;

public class TaskDependencyRepository : BaseRepository
{
    public TaskDependencyRepository(IConfiguration configuration) : base(configuration)
    {
    }

    /// <summary>
    /// Returns all dependency relationships between the requesting user's tasks.
    /// </summary>
    public List<TaskDependency> GetAllForUser(int userId)
    {
        var list = new List<TaskDependency>();

        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"SELECT td.task_id, td.blocked_by, t2.title
              FROM task_dependencies td
              JOIN tasks t1 ON t1.id = td.task_id
              JOIN tasks t2 ON t2.id = td.blocked_by
              WHERE t1.user_id = @user_id
                AND t2.user_id = @user_id
              ORDER BY td.task_id, td.blocked_by",
            conn);

        cmd.Parameters.AddWithValue("user_id", userId);

        conn.Open();
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new TaskDependency
            {
                TaskId = reader.GetInt32(0),
                BlockedBy = reader.GetInt32(1),
                BlockedByTitle = reader.GetString(2)
            });
        }

        return list;
    }

    /// <summary>
    /// Returns all tasks that the given task depends on.
    /// Also checks that the task belongs to the requesting user (ownership guard).
    /// </summary>
    public List<TaskDependency> GetDependencies(int userId, int taskId)
    {
        var list = new List<TaskDependency>();

        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"SELECT td.task_id, td.blocked_by, t2.title
              FROM task_dependencies td
              JOIN tasks t2 ON t2.id = td.blocked_by
              WHERE td.task_id = @task_id
                AND EXISTS (
                    SELECT 1 FROM tasks t1
                    WHERE t1.id = @task_id AND t1.user_id = @user_id
                )
              ORDER BY td.blocked_by",
            conn);

        cmd.Parameters.AddWithValue("task_id", taskId);
        cmd.Parameters.AddWithValue("user_id", userId);

        conn.Open();
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new TaskDependency
            {
                TaskId    = reader.GetInt32(0),
                BlockedBy = reader.GetInt32(1),
                BlockedByTitle = reader.GetString(2)
            });
        }

        return list;
    }

    /// <summary>
    /// Adds a dependency: taskId depends on blockedById.
    /// Returns false if the row already exists (duplicate), true on success.
    /// Both tasks must belong to the requesting user.
    /// </summary>
    public bool AddDependency(int userId, int taskId, int blockedById)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"INSERT INTO task_dependencies (task_id, blocked_by)
              SELECT @task_id, @blocked_by
              WHERE EXISTS (SELECT 1 FROM tasks WHERE id = @task_id    AND user_id = @user_id)
                AND EXISTS (SELECT 1 FROM tasks WHERE id = @blocked_by AND user_id = @user_id)
              ON CONFLICT DO NOTHING",
            conn);

        cmd.Parameters.AddWithValue("task_id",    taskId);
        cmd.Parameters.AddWithValue("blocked_by", blockedById);
        cmd.Parameters.AddWithValue("user_id",    userId);

        conn.Open();
        var affected = cmd.ExecuteNonQuery();
        return affected > 0;
    }

    /// <summary>
    /// Removes a dependency. Returns true if a row was deleted, false if it didn't exist.
    /// Ownership is enforced: the task must belong to the requesting user.
    /// </summary>
    public bool RemoveDependency(int userId, int taskId, int blockedById)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"DELETE FROM task_dependencies
              WHERE task_id   = @task_id
                AND blocked_by = @blocked_by
                AND EXISTS (SELECT 1 FROM tasks WHERE id = @task_id AND user_id = @user_id)",
            conn);

        cmd.Parameters.AddWithValue("task_id",    taskId);
        cmd.Parameters.AddWithValue("blocked_by", blockedById);
        cmd.Parameters.AddWithValue("user_id",    userId);

        conn.Open();
        var affected = cmd.ExecuteNonQuery();
        return affected > 0;
    }
}