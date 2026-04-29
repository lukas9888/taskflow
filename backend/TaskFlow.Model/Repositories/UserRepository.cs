using Microsoft.Extensions.Configuration;
using Npgsql;
using TaskFlow.Model.Entities;

namespace TaskFlow.Model.Repositories;

public class UserRepository : BaseRepository
{
    public UserRepository(IConfiguration configuration) : base(configuration)
    {
    }

    public User? FindByUsernameOrEmail(string login)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"SELECT id, username, email, password_hash, created_at
              FROM users
              WHERE username = @login OR email = @login
              LIMIT 1",
            conn);
        cmd.Parameters.AddWithValue("login", login);
        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            return null;

        return new User
        {
            Id = reader.GetInt32(0),
            Username = reader.GetString(1),
            Email = reader.GetString(2),
            PasswordHash = reader.GetString(3),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(4)
        };
    }

    public User Create(string username, string email, string passwordHash)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd = new NpgsqlCommand(
            @"INSERT INTO users (username, email, password_hash)
              VALUES (@username, @email, @password_hash)
              RETURNING id, username, email, password_hash, created_at",
            conn);
        cmd.Parameters.AddWithValue("username", username);
        cmd.Parameters.AddWithValue("email", email);
        cmd.Parameters.AddWithValue("password_hash", passwordHash);
        conn.Open();
        using var reader = cmd.ExecuteReader();
        if (!reader.Read())
            throw new InvalidOperationException("Insert did not return a row.");

        return new User
        {
            Id = reader.GetInt32(0),
            Username = reader.GetString(1),
            Email = reader.GetString(2),
            PasswordHash = reader.GetString(3),
            CreatedAt = reader.GetFieldValue<DateTimeOffset>(4)
        };
    }
}

