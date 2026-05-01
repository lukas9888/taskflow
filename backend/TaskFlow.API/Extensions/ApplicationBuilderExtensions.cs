namespace TaskFlow.API.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseTaskFlowPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        return app;
    }
}

