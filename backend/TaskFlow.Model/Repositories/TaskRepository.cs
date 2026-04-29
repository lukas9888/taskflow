using Microsoft.Extensions.Configuration;
using Npgsql;
using TaskFlow.Model.Entities;

namespace TaskFlow.Model.Repositories;

public class TaskRepository : BaseRepository
{
    public TaskRepository(IConfiguration configuration) : base(configuration)
    {
    }

    public List<TaskItem> GetAll(int userId)
    {
        var list = new List<TaskItem>();
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            "SELECT id, title, created_at FROM tasks WHERE user_id = @user_id ORDER BY id",
            conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        conn.Open();
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new TaskItem
            {
                Id = reader.GetInt32(0),
                Title = reader.GetString(1),
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(2)
            });
        }

        return list;
    }

    public TaskItem Create(int userId, string title)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            "INSERT INTO tasks (user_id, title) VALUES (@user_id, @title) RETURNING id, title, created_at",
            conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("title", title);
        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            throw new InvalidOperationException("Insert did not return a row.");

        return new TaskItem
        {
            Id = reader.GetInt32(0),
            Title = reader.GetString(1),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(2)
        };
    }

    public TaskItem? Update(int userId, int id, string title)
    {
    using var conn = new NpgsqlConnection(ConnectionString);
    using var cmd = new NpgsqlCommand(
        @"UPDATE tasks
          SET title = @title
          WHERE id = @id AND user_id = @user_id
          RETURNING id, title, created_at",
        conn);

    cmd.Parameters.AddWithValue("user_id", userId);
    cmd.Parameters.AddWithValue("id", id);
    cmd.Parameters.AddWithValue("title", title);

    conn.Open();
    using var reader = cmd.ExecuteReader();

    if (!reader.Read())
        return null;

    return new TaskItem
    {
        Id = reader.GetInt32(0),
        Title = reader.GetString(1),
        CreatedAt = reader.GetFieldValue<DateTimeOffset>(2)
    };
    }

    public bool Delete(int userId, int id)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            "DELETE FROM tasks WHERE id = @id AND user_id = @user_id",
            conn);
        conn.Open();
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("id", id);
        var affected = cmd.ExecuteNonQuery();
        return affected > 0;
    }
}
