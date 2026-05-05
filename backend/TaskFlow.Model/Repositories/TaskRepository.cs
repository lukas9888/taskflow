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

    public List<TaskItem> GetAll(int userId)
    {
        var list = new List<TaskItem>();
        using var conn = new NpgsqlConnection(ConnectionString);

        using var cmd = new NpgsqlCommand(
            @"SELECT t.id, t.title, t.created_at, t.due_at, t.priority::text, uc.name AS category, t.description, t.done
              FROM tasks t
              LEFT JOIN user_categories uc ON uc.id = t.user_category_id
              WHERE t.user_id = @user_id
              ORDER BY t.id",
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
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(2),
                DueAt = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3),
                Priority = reader.GetString(4),
                Category = reader.IsDBNull(5) ? null : reader.GetString(5),
                Description = reader.IsDBNull(6) ? null : reader.GetString(6),
                Done = reader.GetBoolean(7)
            });
        }

        return list;
    }

    public TaskItem Create(
        int userId,
        string title,
        DateTimeOffset? dueAt,
        string priority,
        string? category,
        string? description)
    {
        using var conn = new NpgsqlConnection(ConnectionString);

        using var cmd = new NpgsqlCommand(
            @"WITH cat AS (
                INSERT INTO user_categories (user_id, name)
                SELECT @user_id, @category
                WHERE @category IS NOT NULL
                ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
              )
              INSERT INTO tasks (user_id, title, due_at, priority, user_category_id, description)
              VALUES (
                @user_id,
                @title,
                @due_at,
                CAST(@priority AS task_priority),
                (SELECT id FROM cat),
                @description
              )
              RETURNING id, title, created_at, due_at, priority::text,
                        (SELECT name FROM user_categories WHERE id = user_category_id) AS category,
                        description, done",
            conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("title", title);

        var dueAtParam = cmd.Parameters.Add("due_at", NpgsqlDbType.TimestampTz);
        dueAtParam.Value = dueAt.HasValue ? dueAt.Value : DBNull.Value;

        cmd.Parameters.AddWithValue("priority", priority);
        cmd.Parameters.AddWithValue("category", (object?)category ?? DBNull.Value);
        var descParam = cmd.Parameters.Add("description", NpgsqlDbType.Text);
        descParam.Value = description ?? (object)DBNull.Value;

        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            throw new InvalidOperationException("Insert did not return a row.");

        return ReadTaskRow(reader);
    }

    public TaskItem? Update(
        int userId,
        int id,
        string title,
        DateTimeOffset? dueAt,
        string priority,
        string? category,
        string? description,
        bool done)
    {
        using var conn = new NpgsqlConnection(ConnectionString);

        using var cmd = new NpgsqlCommand(
            @"WITH cat AS (
                INSERT INTO user_categories (user_id, name)
                SELECT @user_id, @category
                WHERE @category IS NOT NULL
                ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
              ),
              upd AS (
                UPDATE tasks
                SET title = @title,
                    due_at = @due_at,
                    priority = CAST(@priority AS task_priority),
                    user_category_id = (SELECT id FROM cat),
                    description = @description,
                  done = @done
                WHERE id = @id AND user_id = @user_id
                RETURNING id, title, created_at, due_at, priority::text,
                          (SELECT name FROM user_categories WHERE id = user_category_id) AS category,
                          description
              )
              SELECT * FROM upd, done",
            conn);

        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("title", title);

        var dueAtParam = cmd.Parameters.Add("due_at", NpgsqlDbType.TimestampTz);
        dueAtParam.Value = dueAt.HasValue ? dueAt.Value : DBNull.Value;

        cmd.Parameters.AddWithValue("priority", priority);
        cmd.Parameters.AddWithValue("category", (object?)category ?? DBNull.Value);
        var descParam = cmd.Parameters.Add("description", NpgsqlDbType.Text);
        descParam.Value = description ?? (object)DBNull.Value;

        cmd.Parameters.AddWithValue("done", done);

        conn.Open();
        using var reader = cmd.ExecuteReader();

        if (!reader.Read())
            return null;

        return ReadTaskRow(reader);
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

    private static TaskItem ReadTaskRow(NpgsqlDataReader reader)
    {
        return new TaskItem
        {
            Id = reader.GetInt32(0),
            Title = reader.GetString(1),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(2),
            DueAt = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3),
            Priority = reader.GetString(4),
            Category = reader.IsDBNull(5) ? null : reader.GetString(5),
            Description = reader.IsDBNull(6) ? null : reader.GetString(6),
            Done = reader.GetBoolean(7)
        };
    }
}
