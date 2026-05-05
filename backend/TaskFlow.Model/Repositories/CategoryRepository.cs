using Microsoft.Extensions.Configuration;
using Npgsql;

namespace TaskFlow.Model.Repositories;

public class CategoryRepository : BaseRepository
{
    public CategoryRepository(IConfiguration configuration) : base(configuration)
    {
    }

    public string UpsertName(int userId, string name)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"INSERT INTO user_categories (user_id, name)
              VALUES (@user_id, @name)
              ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
              RETURNING name",
            conn);
        cmd.Parameters.AddWithValue("user_id", userId);
        cmd.Parameters.AddWithValue("name", name);

        conn.Open();
        var result = cmd.ExecuteScalar();
        return (result as string) ?? name;
    }

    public List<string> GetAllNames(int userId)
    {
        var list = new List<string>();
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"SELECT name
              FROM user_categories
              WHERE user_id = @user_id
              ORDER BY name",
            conn);
        cmd.Parameters.AddWithValue("user_id", userId);

        conn.Open();
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(reader.GetString(0));
        }

        return list;
    }
}

