using Microsoft.Extensions.Configuration;

namespace TaskFlow.Model.Repositories;

public class BaseRepository
{
    protected string ConnectionString { get; }

    public BaseRepository(IConfiguration configuration)
    {
        ConnectionString = configuration.GetConnectionString("TaskFlowDb")
            ?? throw new InvalidOperationException("Missing connection string 'TaskFlowDb'.");
    }
}
