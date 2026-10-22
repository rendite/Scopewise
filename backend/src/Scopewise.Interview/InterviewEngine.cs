using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using Scopewise.Interview.Llm;

namespace Scopewise.Interview;

/// <summary>
/// Runs one interview turn: shows the model the conversation so far and gets
/// back the next question plus its assessment of topic coverage. The engine is
/// stateless – the caller stores the turns and passes them in every time.
/// </summary>
public sealed class InterviewEngine(ILlmClient llm, IOptions<InterviewOptions> options)
{
    private const int MaxAttempts = 2;

    private readonly InterviewOptions _options = options.Value;

    public async Task<InterviewStep> NextAsync(
        InterviewContext context,
        IReadOnlyList<InterviewTurn> turns,
        CancellationToken cancellationToken = default)
    {
        if (turns.Count >= _options.MaxQuestions)
        {
            return new InterviewStep(null, 1, true, DoneReason.MaxQuestions, new Dictionary<Topic, Coverage>(), []);
        }

        var systemPrompt = PromptLibrary.InterviewerSystemPrompt(context);
        var userMessage = BuildUserMessage(turns);
        var calls = new List<LlmResponse>();
        var tooEarly = false;

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            var message = tooEarly
                ? userMessage + $"\n\nThe interview cannot end yet: at least {_options.MinQuestions} questions are required. Ask about the weakest topic."
                : userMessage;
            var response = await llm.GenerateAsync(
                new LlmRequest(systemPrompt, message, Schemas.Step, _options.Model),
                cancellationToken);
            calls.Add(response);

            var raw = TryParse(response.Text);
            if (raw is null)
            {
                continue;
            }

            var coverage = raw.Coverage.ToDictionary();
            var hasQuestion = !string.IsNullOrWhiteSpace(raw.Question);

            if (raw.Done && turns.Count >= _options.MinQuestions)
            {
                return new InterviewStep(null, 1, true, DoneReason.Complete, coverage, calls);
            }
            if (raw.Done && !hasQuestion)
            {
                tooEarly = true;
                continue;
            }
            if (!hasQuestion)
            {
                continue;
            }

            var question = new NextQuestion(raw.Question.Trim(), string.IsNullOrWhiteSpace(raw.Hint) ? null : raw.Hint.Trim());
            return new InterviewStep(question, Progress(coverage), false, null, coverage, calls);
        }

        throw new InterviewException($"The model did not return a valid next question after {MaxAttempts} attempts.");
    }

    /// <summary>Share of topics covered (partial counts half), capped below 1 until the interview is done.</summary>
    public static double Progress(IReadOnlyDictionary<Topic, Coverage> coverage)
    {
        var topics = Enum.GetValues<Topic>();
        var score = topics.Sum(t => coverage.GetValueOrDefault(t) switch
        {
            Coverage.Covered => 1.0,
            Coverage.Partial => 0.5,
            _ => 0.0,
        });
        return Math.Round(Math.Min(0.95, score / topics.Length), 2);
    }

    private string BuildUserMessage(IReadOnlyList<InterviewTurn> turns)
    {
        var remaining = _options.MaxQuestions - turns.Count;
        var budget = $"Questions asked so far: {turns.Count}. Questions left: {remaining} (minimum total {_options.MinQuestions}, maximum {_options.MaxQuestions}).";
        return turns.Count == 0
            ? $"The interview has not started yet. Assess all topics as missing and ask the first question.\n\n{budget}"
            : $"{PromptLibrary.Transcript(turns)}\n\n{budget}\n\nAssess the coverage and decide the next step.";
    }

    private static RawStep? TryParse(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<RawStep>(json, Schemas.JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record RawStep(
        RawCoverage Coverage,
        bool Done,
        [property: JsonRequired] string Question,
        string? Hint);

    private sealed record RawCoverage(
        Coverage Goals,
        Coverage Audience,
        Coverage Scope,
        Coverage Design,
        Coverage Content,
        Coverage Technical,
        Coverage BudgetTimeline)
    {
        public Dictionary<Topic, Coverage> ToDictionary() => new()
        {
            [Topic.Goals] = Goals,
            [Topic.Audience] = Audience,
            [Topic.Scope] = Scope,
            [Topic.Design] = Design,
            [Topic.Content] = Content,
            [Topic.Technical] = Technical,
            [Topic.BudgetTimeline] = BudgetTimeline,
        };
    }
}
