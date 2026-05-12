using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using TaskFlow.Model.Repositories;
using System.Collections.Generic;

namespace TaskFlow.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddTaskFlowServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Enter your JWT token here. Example: 'Bearer {your_token}' (The 'Bearer ' prefix is added automatically by the Http scheme)",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT"
            });

            options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("Bearer", document),
                    new List<string>()
                }
            });
        });

        services.AddRepositories();
        services.AddTaskFlowJwtAuthentication(configuration);
        services.AddAuthorization();
        services.AddTaskFlowCors();

        return services;
    }

    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<TaskRepository>();
        services.AddScoped<CategoryRepository>();
        services.AddScoped<UserRepository>();
        services.AddScoped<TaskDependencyRepository>();
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