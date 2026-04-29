using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserRepository _users;
    private readonly IConfiguration _config;

    public AuthController(UserRepository users, IConfiguration config)
    {
        _users = users;
        _config = config;
    }

    [HttpPost("register")]
    public ActionResult<RegisterResponseDto> Register([FromBody] RegisterRequestDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var username = body.Username.Trim();
        var email = body.Email.Trim().ToLowerInvariant();

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(body.Password);

        try
        {
            var created = _users.Create(username, email, passwordHash);
            return Created("", new RegisterResponseDto
            {
                Id = created.Id,
                Username = created.Username,
                Email = created.Email
            });
        }
        catch (PostgresException ex) when (ex.SqlState == "23505")
        {
            return Conflict("Username or email already exists.");
        }
    }

    [HttpPost("login")]
    public ActionResult<LoginResponseDto> Login([FromBody] LoginRequestDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var login = body.Login.Trim();
        var user = _users.FindByUsernameOrEmail(login);
        if (user is null)
            return Unauthorized();

        var ok = BCrypt.Net.BCrypt.Verify(body.Password, user.PasswordHash);
        if (!ok)
            return Unauthorized();

        var jwt = _config.GetSection("Jwt");
        var issuer = jwt.GetValue<string>("Issuer") ?? "TaskFlow";
        var audience = jwt.GetValue<string>("Audience") ?? "TaskFlow";
        var signingKey = jwt.GetValue<string>("SigningKey")
            ?? throw new InvalidOperationException("Missing config: Jwt:SigningKey");
        var expiresMinutes = jwt.GetValue<int?>("ExpiresMinutes") ?? 60;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Email, user.Email)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        var expiresInSeconds = (int)Math.Max(0, (expires - DateTime.UtcNow).TotalSeconds);

        return Ok(new LoginResponseDto
        {
            AccessToken = tokenString,
            ExpiresInSeconds = expiresInSeconds
        });
    }
}

public class RegisterRequestDto
{
    [Required]
    [MinLength(3)]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}

public class RegisterResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class LoginRequestDto
{
    [Required]
    [MinLength(3)]
    [MaxLength(255)]
    public string Login { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresInSeconds { get; set; }
}

