namespace Scopewise.Interview.Llm;

/// <summary>
/// Provider-neutral access to a language model. The interview engine only
/// talks to this interface, so switching from Gemini to another provider
/// means writing one new implementation.
/// </summary>
public interface ILlmClient
{
    Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default);
}

/// <param name="SystemPrompt">Instructions from us (trusted).</param>
/// <param name="UserMessage">Conversation data, including client answers (untrusted).</param>
/// <param name="JsonSchema">When set, the model must answer with JSON matching this schema.</param>
/// <param name="Model">Overrides the client's default model.</param>
public sealed record LlmRequest(
    string SystemPrompt,
    string UserMessage,
    string? JsonSchema = null,
    string? Model = null,
    double? Temperature = null);

public sealed record LlmResponse(
    string Text,
    string Model,
    TimeSpan Latency,
    int InputTokens,
    int OutputTokens);
