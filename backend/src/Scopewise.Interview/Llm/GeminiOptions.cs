namespace Scopewise.Interview.Llm;

public sealed class GeminiOptions
{
    public const string SectionName = "Gemini";

    /// <summary>Set via user-secrets (Gemini:ApiKey) or the GEMINI_API_KEY environment variable.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Default model; can be overridden per request.</summary>
    public string Model { get; set; } = "gemini-flash-latest";

    /// <summary>Per-request timeout. Interview turns should be fast; briefings can take longer.</summary>
    public int TimeoutSeconds { get; set; } = 60;
}
