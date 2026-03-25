using Microsoft.Extensions.Configuration;
using Npgsql;
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
            "SELECT id, title, created_at FROM tasks ORDER BY id",
            conn);
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

    public TaskItem Create(string title)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            "INSERT INTO tasks (title) VALUES (@title) RETURNING id, title, created_at",
            conn);
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
