using Microsoft.Extensions.Options;
using Scopewise.Interview;

namespace Scopewise.Api.Tests.Interview;

public class BriefingGeneratorTests
{
    private static readonly InterviewContext Context = new("Pixel & Co", "Bakery Müller", ProjectType.Website);

    private const string ValidBriefing = """
        {
          "summary": "Family bakery needs a website with cake pre-orders.",
          "goals": ["Take pre-orders online", "  "],
          "audience": ["Local families"],
          "scope": [], "design": [], "content": [], "technical": [],
          "budgetTimeline": ["€4,000–6,000"],
          "openQuestions": ["Do they own the domain?"]
        }
        """;

    private static BriefingGenerator Generator(FakeLlmClient llm) =>
        new(llm, Options.Create(new InterviewOptions()));

    [Fact]
    public async Task ParsesAllSectionsInFixedOrderWithTitles()
    {
        var (briefing, _) = await Generator(new FakeLlmClient(ValidBriefing))
            .GenerateAsync(Context, [new("Goal?", "Pre-orders")]);

        Assert.Equal("Family bakery needs a website with cake pre-orders.", briefing.Summary);
        Assert.Equal(
            ["goals", "audience", "scope", "design", "content", "technical", "budgetTimeline"],
            briefing.Sections.Select(s => s.Key));
        Assert.Equal("Budget & timeline", briefing.Sections[^1].Title);
        Assert.Equal(["Take pre-orders online"], briefing.Sections[0].Items);
        Assert.Equal(["Do they own the domain?"], briefing.OpenQuestions);
    }

    [Fact]
    public async Task InvalidJson_IsRetried()
    {
        var llm = new FakeLlmClient("{ broken", ValidBriefing);

        var (briefing, _) = await Generator(llm).GenerateAsync(Context, [new("Goal?", "Pre-orders")]);

        Assert.Equal(2, llm.Requests.Count);
        Assert.NotEmpty(briefing.Summary);
    }
}
