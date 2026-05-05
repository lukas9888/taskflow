using Microsoft.Extensions.Configuration;
using Npgsql;

namespace TaskFlow.Model.Repositories;

public class CategoryRepository : BaseRepository
{
    public CategoryRepository(IConfiguration configuration) : base(configuration)
    {
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

