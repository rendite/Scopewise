using Scopewise.Interview.Llm;

namespace Scopewise.Api.Tests.Interview;

/// <summary>Returns scripted responses in order and records every request.</summary>
public sealed class FakeLlmClient(params string[] responses) : ILlmClient
{
    private readonly Queue<string> _responses = new(responses);

    public List<LlmRequest> Requests { get; } = [];

    public Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default)
    {
        Requests.Add(request);
        var text = _responses.Count > 0 ? _responses.Dequeue() : throw new InvalidOperationException("No scripted response left.");
        return Task.FromResult(new LlmResponse(text, "fake", TimeSpan.FromMilliseconds(10), 100, 20));
    }

    public static string Step(string question, bool done = false, string coverage = "missing", string hint = "") => $$"""
        {
          "coverage": { "goals": "{{coverage}}", "audience": "{{coverage}}", "scope": "{{coverage}}", "design": "{{coverage}}",
                        "content": "{{coverage}}", "technical": "{{coverage}}", "budgetTimeline": "{{coverage}}" },
          "done": {{(done ? "true" : "false")}},
          "question": "{{question}}",
          "hint": "{{hint}}"
        }
        """;
}
