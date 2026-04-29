using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;
using TaskFlow.Model.Entities;

namespace TaskFlow.Model.Repositories;

public class TaskRepository : BaseRepository
{
    public TaskRepository(IConfiguration configuration) : base(configuration)
    {
    }

    public List<TaskItem> GetAll()
    {
        var list = new List<TaskItem>();
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            "SELECT id, title, created_at, due_at FROM tasks ORDER BY id",
            conn);
        conn.Open();
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new TaskItem
            {
                Id = reader.GetInt32(0),
                Title = reader.GetString(1),
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(2),
                DueAt = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3)
            });
        }

        return list;
    }

    public TaskItem Create(string title, DateTimeOffset? dueAt)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
              @"INSERT INTO tasks (title, due_at)
                VALUES (@title, @due_at)
                RETURNING id, title, created_at, due_at",
            conn);
        cmd.Parameters.AddWithValue("title", title);

        var dueAtParam = cmd.Parameters.Add("due_at", NpgsqlDbType.TimestampTz);
        dueAtParam.Value = dueAt.HasValue ? dueAt.Value : DBNull.Value;

        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            throw new InvalidOperationException("Insert did not return a row.");

        return new TaskItem
        {
            Id = reader.GetInt32(0),
            Title = reader.GetString(1),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(2),
            DueAt = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3)

        };
    }

    public TaskItem? Update(int id, string title, DateTimeOffset? dueAt)
    {
    using var conn = new NpgsqlConnection(ConnectionString);
    using var cmd = new NpgsqlCommand(
        @"UPDATE tasks
          SET title = @title,
            due_at = @due_at
          WHERE id = @id
          RETURNING id, title, created_at, due_at",
        conn);

    cmd.Parameters.AddWithValue("id", id);
    cmd.Parameters.AddWithValue("title", title);

    var dueAtParam = cmd.Parameters.Add("due_at", NpgsqlDbType.TimestampTz);
    dueAtParam.Value = dueAt.HasValue ? dueAt.Value : DBNull.Value;

    conn.Open();
    using var reader = cmd.ExecuteReader();

    if (!reader.Read())
        return null;

    return new TaskItem
        {
        Id = reader.GetInt32(0),
        Title = reader.GetString(1),
        CreatedAt = reader.GetFieldValue<DateTimeOffset>(2),
        DueAt = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3)

        };
    }

    public bool Delete(int id)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            "DELETE FROM tasks WHERE id = @id",
            conn);
        conn.Open();
        cmd.Parameters.AddWithValue("id", id);
        var affected = cmd.ExecuteNonQuery();
        return affected > 0;
    }
}
