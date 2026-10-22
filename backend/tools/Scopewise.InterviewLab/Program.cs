// Scopewise InterviewLab – try the interview engine without the web app.
//
//   dotnet run --project tools/Scopewise.InterviewLab -- models
//   dotnet run --project tools/Scopewise.InterviewLab -- chat [--type website] [--lang German] [--model <id>]
//   dotnet run --project tools/Scopewise.InterviewLab -- simulate [--models a,b] [--personas bakery,cardealer]
//        [--persona-model <id>] [--pause-ms 0] [--out simulation-results]

using System.Globalization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Scopewise.Interview;
using Scopewise.Interview.Llm;
using Scopewise.InterviewLab;

// Reports use "1.5" style numbers regardless of the machine locale.
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

var configuration = new ConfigurationBuilder()
    .AddUserSecrets<Persona>()
    .AddEnvironmentVariables()
    .Build();

var geminiOptions = new GeminiOptions();
configuration.GetSection(GeminiOptions.SectionName).Bind(geminiOptions);
geminiOptions.ApiKey ??= configuration["GEMINI_API_KEY"];
var gemini = new GeminiLlmClient(Options.Create(geminiOptions));

var command = args.FirstOrDefault();
var options = Args.Parse(args.Skip(1));

try
{
    switch (command)
    {
        case "models":
            foreach (var name in await gemini.ListModelsAsync())
            {
                Console.WriteLine(name);
            }
            break;
        case "chat":
            await ChatCommand.RunAsync(gemini, geminiOptions.Model, options);
            break;
        case "simulate":
            await SimulateCommand.RunAsync(gemini, geminiOptions.Model, options);
            break;
        default:
            Console.WriteLine("Usage: InterviewLab <models|chat|simulate> [options]. See the comment at the top of Program.cs.");
            return 1;
    }
}
catch (InvalidOperationException e) when (e.Message.Contains("API key"))
{
    Console.Error.WriteLine(e.Message);
    return 1;
}

return 0;
