using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TaskFlow.Model.Repositories;

namespace TaskFlow.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddTaskFlowServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        services.AddRepositories();
        services.AddTaskFlowJwtAuthentication(configuration);
        services.AddAuthorization();
        services.AddTaskFlowCors();

        return services;
    }

    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<TaskRepository>();
        services.AddScoped<UserRepository>();
        return services;
    }

    public static IServiceCollection AddTaskFlowJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection("Jwt");
        var signingKey = jwt.GetValue<string>("SigningKey")
            ?? throw new InvalidOperationException("Missing config: Jwt:SigningKey");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.GetValue<string>("Issuer"),
                    ValidateAudience = true,
                    ValidAudience = jwt.GetValue<string>("Audience"),
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        return services;
    }

    public static IServiceCollection AddTaskFlowCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
                policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
        });

        return services;
    }
}

