using System.Text.Json;
using Microsoft.Extensions.Options;
using Scopewise.Interview.Llm;

namespace Scopewise.Interview;

/// <summary>Turns a finished interview into the structured briefing the agency reads.</summary>
public sealed class BriefingGenerator(ILlmClient llm, IOptions<InterviewOptions> options)
{
    private const int MaxAttempts = 2;

    private static readonly Dictionary<Topic, string> Titles = new()
    {
        [Topic.Goals] = "Goals",
        [Topic.Audience] = "Audience",
        [Topic.Scope] = "Pages & features",
        [Topic.Design] = "Design",
        [Topic.Content] = "Content",
        [Topic.Technical] = "Technical",
        [Topic.BudgetTimeline] = "Budget & timeline",
    };

    public async Task<(Briefing Briefing, LlmResponse Call)> GenerateAsync(
        InterviewContext context,
        IReadOnlyList<InterviewTurn> turns,
        CancellationToken cancellationToken = default)
    {
        var request = new LlmRequest(
            PromptLibrary.BriefingSystemPrompt(context),
            $"{PromptLibrary.Transcript(turns)}\n\nWrite the briefing.",
            Schemas.Briefing,
            options.Value.BriefingModel);

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            var response = await llm.GenerateAsync(request, cancellationToken);
            var briefing = TryParse(response.Text);
            if (briefing is not null)
            {
                return (briefing, response);
            }
        }

        throw new InterviewException($"The model did not return a valid briefing after {MaxAttempts} attempts.");
    }

    private static Briefing? TryParse(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            var sections = Enum.GetValues<Topic>()
                .Select(topic =>
                {
                    var key = JsonNaming.CamelCase(topic.ToString());
                    return new BriefingSection(key, Titles[topic], ReadList(root, key));
                })
                .ToList();
            return new Briefing(root.GetProperty("summary").GetString() ?? "", sections, ReadList(root, "openQuestions"));
        }
        catch (Exception e) when (e is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            return null;
        }
    }

    private static List<string> ReadList(JsonElement root, string name) =>
        root.GetProperty(name).EnumerateArray()
            .Select(item => item.GetString()?.Trim() ?? "")
            .Where(item => item.Length > 0)
            .ToList();
}
