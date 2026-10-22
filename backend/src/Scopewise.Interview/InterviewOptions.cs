namespace Scopewise.Interview;

public sealed class InterviewOptions
{
    public const string SectionName = "Interview";

    /// <summary>The interviewer may not finish before this many answers.</summary>
    public int MinQuestions { get; set; } = 8;

    /// <summary>Hard stop to keep the survey within 10–15 minutes.</summary>
    public int MaxQuestions { get; set; } = 20;

    /// <summary>Model for interview turns; null uses the LLM client's default.</summary>
    public string? Model { get; set; }

    /// <summary>Model for the final briefing; null uses the LLM client's default.</summary>
    public string? BriefingModel { get; set; }
}
