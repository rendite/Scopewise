namespace Scopewise.Interview;

// Values match docs/API.md (serialized in camelCase).
public enum ProjectType
{
    Website,
    Webshop,
    Webapp,
    MobileApp,
    Custom,
}

/// <summary>The briefing topics the interview must cover. Same keys as the briefing sections.</summary>
public enum Topic
{
    Goals,
    Audience,
    Scope,
    Design,
    Content,
    Technical,
    BudgetTimeline,
}

public enum Coverage
{
    Missing,
    Partial,
    Covered,
}

/// <summary>What the engine knows about the survey. Comes from the agency, so it is trusted.</summary>
/// <param name="StartLanguage">Language of the first question; afterwards the interviewer follows the client.</param>
public sealed record InterviewContext(
    string AgencyName,
    string ClientName,
    ProjectType ProjectType,
    string StartLanguage = "English");

/// <summary>One answered question. The answer is written by the client and therefore untrusted.</summary>
public sealed record InterviewTurn(string Question, string Answer);

public sealed record NextQuestion(string Text, string? Hint);

public enum DoneReason
{
    /// <summary>The model judged all topics sufficiently covered.</summary>
    Complete,

    /// <summary>The question limit was reached.</summary>
    MaxQuestions,
}

/// <summary>Result of one interview turn.</summary>
/// <param name="Question">Next question, or null when the interview is done.</param>
/// <param name="Progress">0–1 estimate based on topic coverage.</param>
public sealed record InterviewStep(
    NextQuestion? Question,
    double Progress,
    bool Done,
    DoneReason? DoneReason,
    IReadOnlyDictionary<Topic, Coverage> Coverage,
    IReadOnlyList<Llm.LlmResponse> LlmCalls);

public sealed record Briefing(
    string Summary,
    IReadOnlyList<BriefingSection> Sections,
    IReadOnlyList<string> OpenQuestions);

/// <param name="Key">Topic key in camelCase, as in docs/API.md (e.g. "budgetTimeline").</param>
public sealed record BriefingSection(string Key, string Title, IReadOnlyList<string> Items);
