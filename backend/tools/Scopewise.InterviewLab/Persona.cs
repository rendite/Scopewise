using Scopewise.Interview;
using Scopewise.Interview.Llm;

namespace Scopewise.InterviewLab;

/// <summary>A fictional client, played by a language model, for simulated interviews.</summary>
public sealed record Persona(string Id, string ClientName, ProjectType ProjectType)
{
    public static readonly IReadOnlyList<Persona> All =
    [
        new("bakery", "Bäckerei Müller", ProjectType.Website),
        new("cardealer", "Weber Autohaus", ProjectType.Website),
        new("yogastudio", "Lotus Yoga", ProjectType.Webapp),
    ];

    public string Description => File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Personas", $"{Id}.md"));

    public async Task<(string Answer, LlmResponse Call)> AnswerAsync(
        ILlmClient llm, string? model, IReadOnlyList<InterviewTurn> turns, NextQuestion question, CancellationToken cancellationToken)
    {
        var system = Description + """

            You see one question at a time on a survey page. Reply with only your answer text, as you would type it.
            Stay in character. Never mention that you are an AI or that this is a simulation.
            """;
        var history = turns.Count == 0 ? "" : $"Your earlier answers in this survey:\n{PromptLibrary.Transcript(turns)}\n\n";
        var hint = question.Hint is null ? "" : $"\n(Small print under the question: {question.Hint})";
        var call = await llm.GenerateAsync(
            new LlmRequest(system, $"{history}The survey now asks:\n{question.Text}{hint}", Model: model, Temperature: 0.9),
            cancellationToken);
        return (call.Text.Trim(), call);
    }
}
