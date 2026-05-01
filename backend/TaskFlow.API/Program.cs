using TaskFlow.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddTaskFlowServices(builder.Configuration);

var app = builder.Build();
app.UseTaskFlowPipeline();

app.Run();
