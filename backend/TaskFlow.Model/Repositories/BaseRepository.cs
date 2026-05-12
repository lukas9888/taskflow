using Microsoft.Extensions.Configuration;
using Npgsql;

namespace TaskFlow.Model.Repositories;

public class BaseRepository
{
    protected string ConnectionString { get; }

    public BaseRepository(IConfiguration configuration)
    {
        ConnectionString = configuration.GetConnectionString("TaskFlowDb")
            ?? throw new InvalidOperationException("Missing connection string 'TaskFlowDb'.");
    }

    // Session-scoped GUC for RLS (009). is_local must be false: with true, autocommit ends the
    // transaction after set_config, so the value is gone before ExecuteReader on the same connection.
    protected static void SetUserId(NpgsqlConnection conn, int userId)
    {
        using var cmd = new NpgsqlCommand("SELECT set_config('app.current_user_id', @uid::text, false)", conn);
        cmd.Parameters.AddWithValue("uid", userId);
        cmd.ExecuteNonQuery();
    }
}
