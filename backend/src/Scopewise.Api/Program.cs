var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// The dashboard and survey apps run on their own origins during development.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("GetHealth");

app.Run();

// Exposed so integration tests can use WebApplicationFactory<Program>.
public partial class Program;
