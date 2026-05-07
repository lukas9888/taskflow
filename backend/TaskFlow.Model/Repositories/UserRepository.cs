using Microsoft.Extensions.Configuration;
using Npgsql;
using TaskFlow.Model.Entities;

namespace TaskFlow.Model.Repositories;

public class UserRepository : BaseRepository
{
    public UserRepository(IConfiguration configuration) : base(configuration)
    {
    }

    public User? FindByUsername(string username)
    {
        using var conn = new NpgsqlConnection(ConnectionString);

        using var cmd = new NpgsqlCommand(
            @"SELECT id, username, password_hash, created_at
              FROM users
              WHERE username = @username
              LIMIT 1",
            conn);
        cmd.Parameters.AddWithValue("username", username);

        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            return null;

        return new User
        {
            Id = reader.GetInt32(0),
            Username = reader.GetString(1),
            PasswordHash = reader.GetString(2),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(3)
        };
    }

    public User Create(string username, string passwordHash)
    {
        using var conn = new NpgsqlConnection(ConnectionString);

        using var cmd = new NpgsqlCommand(
            @"INSERT INTO users (username, password_hash)
              VALUES (@username, @password_hash)
              RETURNING id, username, password_hash, created_at",
            conn);
        cmd.Parameters.AddWithValue("username", username);
        cmd.Parameters.AddWithValue("password_hash", passwordHash);

        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            throw new InvalidOperationException("Insert did not return a row.");

        return new User
        {
            Id = reader.GetInt32(0),
            Username = reader.GetString(1),
            PasswordHash = reader.GetString(2),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(3)
        };
    }
}

