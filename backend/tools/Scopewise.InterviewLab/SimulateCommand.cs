using System.Diagnostics;
using System.Text;
using Microsoft.Extensions.Options;
using Scopewise.Interview;
using Scopewise.Interview.Llm;

namespace Scopewise.InterviewLab;

/// <summary>
/// Lets a model play fictional clients and interviews them with one or more
/// interviewer models. Writes transcripts, briefings and a comparison report.
/// </summary>
public static class SimulateCommand
{
    // Rough client-side time per question, on top of waiting for the model:
    // reading the question plus typing on a phone (~2 s per word).
    private const double ReadSeconds = 8;
    private const double SecondsPerWord = 2;

    public static async Task RunAsync(ILlmClient llm, string defaultModel, Args args)
    {
        var models = args.GetList("models") is { Length: > 0 } list ? list : [defaultModel];
        var personaIds = args.GetList("personas");
        var personas = personaIds.Length == 0 ? Persona.All : Persona.All.Where(p => personaIds.Contains(p.Id)).ToList();
        var personaModel = args.Get("persona-model") ?? defaultModel;
        var pause = TimeSpan.FromMilliseconds(args.GetInt("pause-ms", 0));
        var outDir = args.Get("out") ?? "simulation-results";
        Directory.CreateDirectory(Path.Combine(outDir, "transcripts"));

        Console.WriteLine($"Simulating {personas.Count} client(s) × {models.Length} model(s). Clients played by {personaModel}.\n");

        var results = new List<RunResult>();
        foreach (var model in models)
        {
            foreach (var persona in personas)
            {
                Console.Write($"{model,-28} {persona.Id,-12} ");
                var result = await RunOneAsync(llm, model, persona, personaModel, pause, outDir);
                results.Add(result);
                Console.WriteLine(result.Error is null
                    ? $"{result.Questions} questions · avg {result.AvgLatency:F1}s · ~{result.ClientMinutes:F0} min · {result.EndReason}"
                    : $"FAILED: {result.Error}");
            }
        }

        var reportPath = Path.Combine(outDir, "report.md");
        await File.WriteAllTextAsync(reportPath, Report(results, personaModel));
        Console.WriteLine($"\nReport: {Path.GetFullPath(reportPath)}");
    }

    private static async Task<RunResult> RunOneAsync(
        ILlmClient llm, string model, Persona persona, string personaModel, TimeSpan pause, string outDir)
    {
        var context = new InterviewContext("Pixel & Co", persona.ClientName, persona.ProjectType);
        var interviewOptions = Options.Create(new InterviewOptions { Model = model, BriefingModel = model });
        var engine = new InterviewEngine(llm, interviewOptions);
        var turns = new List<InterviewTurn>();
        var latencies = new List<double>();
        var tokens = 0;
        var clientSeconds = 0.0;
        var transcript = new StringBuilder($"# {persona.ClientName} – {model}\n\n");
        InterviewStep? step = null;
        var wall = Stopwatch.StartNew();

        try
        {
            while (true)
            {
                step = await engine.NextAsync(context, turns);
                latencies.Add(step.LlmCalls.Sum(c => c.Latency.TotalSeconds));
                tokens += step.LlmCalls.Sum(c => c.InputTokens + c.OutputTokens);
                if (step.Done || step.Question is null)
                {
                    break;
                }

                await Task.Delay(pause);
                var (answer, _) = await persona.AnswerAsync(llm, personaModel, turns, step.Question, CancellationToken.None);
                await Task.Delay(pause);

                clientSeconds += latencies[^1] + ReadSeconds + SecondsPerWord * answer.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
                transcript.Append($"**Q{turns.Count + 1}** _({step.Progress:P0}, {latencies[^1]:F1}s)_ {step.Question.Text}\n");
                if (step.Question.Hint is not null)
                {
                    transcript.Append($"> {step.Question.Hint}\n");
                }
                transcript.Append($"\n**A:** {answer}\n\n");
                turns.Add(new InterviewTurn(step.Question.Text, answer));
            }

            transcript.Append($"_Interview ended: {step.DoneReason} after {turns.Count} questions. Final coverage: {ChatCommand.Coverage(step)}_\n\n");
            var (briefing, briefingCall) = await new BriefingGenerator(llm, interviewOptions).GenerateAsync(context, turns);
            tokens += briefingCall.InputTokens + briefingCall.OutputTokens;
            transcript.Append(Markdown.Briefing(briefing));
            transcript.Append($"\n_Briefing generated in {briefingCall.Latency.TotalSeconds:F1}s._\n");

            return new RunResult(model, persona.Id, turns.Count, step.DoneReason?.ToString() ?? "", latencies.Average(), latencies.Max(),
                tokens, clientSeconds / 60, CountCoverage(step), null, wall.Elapsed);
        }
        catch (Exception e) when (e is not OperationCanceledException)
        {
            transcript.Append($"\n**Run failed:** {e.Message}\n");
            return new RunResult(model, persona.Id, turns.Count, "", latencies.DefaultIfEmpty().Average(), latencies.DefaultIfEmpty().Max(),
                tokens, clientSeconds / 60, "", e.Message, wall.Elapsed);
        }
        finally
        {
            var file = Path.Combine(outDir, "transcripts", $"{Safe(model)}--{persona.Id}.md");
            await File.WriteAllTextAsync(file, transcript.ToString());
        }
    }

    private static string CountCoverage(InterviewStep step)
    {
        var counts = step.Coverage.Values.GroupBy(c => c).ToDictionary(g => g.Key, g => g.Count());
        return step.Coverage.Count == 0
            ? "n/a"
            : $"{counts.GetValueOrDefault(Coverage.Covered)}/{counts.GetValueOrDefault(Coverage.Partial)}/{counts.GetValueOrDefault(Coverage.Missing)}";
    }

    private static string Report(List<RunResult> results, string personaModel)
    {
        var md = new StringBuilder("# Interview simulation\n\n");
        md.Append($"Run {DateTime.Now:yyyy-MM-dd HH:mm}. Clients played by `{personaModel}`. ");
        md.Append("Client time is an estimate: model wait + reading + typing (~2 s per word).\n\n");
        md.Append("| Model | Client | Questions | Ended | Avg wait (s) | Max wait (s) | Client time (min) | Coverage covered/partial/missing | Tokens |\n");
        md.Append("|---|---|---|---|---|---|---|---|---|\n");
        foreach (var r in results)
        {
            md.Append(r.Error is null
                ? $"| {r.Model} | {r.Persona} | {r.Questions} | {r.EndReason} | {r.AvgLatency:F1} | {r.MaxLatency:F1} | {r.ClientMinutes:F0} | {r.Coverage} | {r.Tokens:N0} |\n"
                : $"| {r.Model} | {r.Persona} | – | failed: {r.Error.ReplaceLineEndings(" ")} | | | | | |\n");
        }
        md.Append("\nRead the transcripts in `transcripts/` to judge question quality and briefing accuracy – the numbers alone don't tell you that.\n");
        return md.ToString();
    }

    private static string Safe(string name) => string.Concat(name.Select(c => char.IsLetterOrDigit(c) || c is '-' or '.' ? c : '_'));

    private sealed record RunResult(
        string Model, string Persona, int Questions, string EndReason, double AvgLatency, double MaxLatency,
        int Tokens, double ClientMinutes, string Coverage, string? Error, TimeSpan Wall);
}
