using Microsoft.Extensions.Options;
using Scopewise.Interview;
using Scopewise.Interview.Llm;

namespace Scopewise.InterviewLab;

/// <summary>You play the client in the terminal.</summary>
public static class ChatCommand
{
    private const string SkipAnswer = "I'm not sure / I don't know yet.";

    public static async Task RunAsync(ILlmClient llm, string defaultModel, Args args)
    {
        var model = args.Get("model") ?? defaultModel;
        var type = Enum.TryParse<ProjectType>(args.Get("type"), ignoreCase: true, out var parsed) ? parsed : ProjectType.Website;
        var context = new InterviewContext(
            args.Get("agency") ?? "Pixel & Co",
            args.Get("client") ?? "Test Client",
            type,
            args.Get("lang") ?? "English");
        var interviewOptions = Options.Create(new InterviewOptions { Model = model, BriefingModel = model });
        var engine = new InterviewEngine(llm, interviewOptions);
        var turns = new List<InterviewTurn>();

        Console.WriteLine($"Model {model} · {type} · type /skip to skip, /quit to stop.\n");

        while (true)
        {
            var step = await engine.NextAsync(context, turns);
            var latency = step.LlmCalls.Sum(c => c.Latency.TotalSeconds);
            Write(ConsoleColor.DarkGray, $"[{step.Progress:P0} · {latency:F1}s · {Coverage(step)}]");

            if (step.Done || step.Question is null)
            {
                Write(ConsoleColor.Green, $"\nInterview finished ({step.DoneReason}) after {turns.Count} questions.");
                break;
            }

            Write(ConsoleColor.Cyan, step.Question.Text);
            if (step.Question.Hint is not null)
            {
                Write(ConsoleColor.DarkCyan, step.Question.Hint);
            }

            Console.Write("> ");
            var answer = Console.ReadLine()?.Trim();
            if (answer is null or "/quit")
            {
                return;
            }
            if (answer is "" or "/skip")
            {
                answer = SkipAnswer;
            }
            turns.Add(new InterviewTurn(step.Question.Text, answer));
            Console.WriteLine();
        }

        Write(ConsoleColor.DarkGray, "\nWriting the briefing…");
        var (briefing, _) = await new BriefingGenerator(llm, interviewOptions).GenerateAsync(context, turns);
        Console.WriteLine();
        Console.WriteLine(Markdown.Briefing(briefing));
    }

    public static string Coverage(InterviewStep step) =>
        string.Join(" ", step.Coverage.Select(c => $"{c.Key}:{c.Value.ToString()[0]}"));

    private static void Write(ConsoleColor color, string text)
    {
        Console.ForegroundColor = color;
        Console.WriteLine(text);
        Console.ResetColor();
    }
}
