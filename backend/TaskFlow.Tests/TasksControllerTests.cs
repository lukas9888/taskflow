using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using TaskFlow.API.Controllers;
using TaskFlow.Model.Entities;
using TaskFlow.Model.Repositories;

namespace TaskFlow.Tests;

public class TasksControllerTests
{
    [Fact]
    public void Create_ReturnsCreatedAtAction_WhenModelStateIsValid()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:TaskFlowDb"] =
                        "Host=localhost;Database=test;Username=test;Password=test"
                })
            .Build();

        var repoMock = new Mock<TaskRepository>(MockBehavior.Strict, config);
        var controller = new TasksController(repoMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity(
                            new[] { new Claim(ClaimTypes.NameIdentifier, "1") },
                            authenticationType: "Test"))
                }
            }
        };

        var created = new TaskItem { Id = 123, Title = "My new task" };

        repoMock
            .Setup(r => r.Create(1, "My new task", null, "medium", null, null))
            .Returns(created);

        var body = new CreateTaskDto { Title = "  My new task  " };

        var result = controller.Create(body);

        var createdAt = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(TasksController.GetById), createdAt.ActionName);
        Assert.Equal(created.Id, createdAt.RouteValues?["id"]);
        Assert.Equal(created, createdAt.Value);
    }

    [Fact]
    public void Create_ReturnsValidationProblem_WhenModelStateIsInvalid()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:TaskFlowDb"] =
                        "Host=localhost;Database=test;Username=test;Password=test"
                })
            .Build();

        var repoMock = new Mock<TaskRepository>(MockBehavior.Strict, config);
        var controller = new TasksController(repoMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity(
                            new[] { new Claim(ClaimTypes.NameIdentifier, "1") },
                            authenticationType: "Test"))
                }
            }
        };

        controller.ModelState.AddModelError("Title", "Required");

        var result = controller.Create(new CreateTaskDto { Title = "" });

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        var details = Assert.IsType<ValidationProblemDetails>(objectResult.Value);
        Assert.True(details.Errors.ContainsKey("Title"));

        repoMock.VerifyNoOtherCalls();
    }
}

