using System.Diagnostics;
using System.Text.Json.Nodes;
using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Options;

namespace Scopewise.Interview.Llm;

/// <summary>ILlmClient backed by the Google Gemini API (official Google.GenAI SDK).</summary>
public sealed class GeminiLlmClient(IOptions<GeminiOptions> options) : ILlmClient
{
    private readonly GeminiOptions _options = options.Value;
    private Client? _client;

    // Created lazily so the API can start (and tests can run) without a key.
    private Client Client => _client ??= new Client(
        apiKey: string.IsNullOrWhiteSpace(_options.ApiKey)
            ? throw new InvalidOperationException(
                "Gemini API key missing. Set it with: dotnet user-secrets set \"Gemini:ApiKey\" \"<key>\" --project src/Scopewise.Api")
            : _options.ApiKey,
        httpOptions: new HttpOptions
        {
            Timeout = _options.TimeoutSeconds * 1000,
            // The free tier has low rate limits; back off and retry on 429/5xx.
            RetryOptions = new HttpRetryOptions { Attempts = 5 },
        });

    public async Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default)
    {
        var model = request.Model ?? _options.Model;
        var config = new GenerateContentConfig
        {
            SystemInstruction = new Content { Parts = [new Part { Text = request.SystemPrompt }] },
            Temperature = request.Temperature,
        };
        if (request.JsonSchema is not null)
        {
            config.ResponseMimeType = "application/json";
            config.ResponseJsonSchema = JsonNode.Parse(request.JsonSchema);
        }

        var stopwatch = Stopwatch.StartNew();
        var response = await Client.Models.GenerateContentAsync(
            model: model,
            contents: request.UserMessage,
            config: config,
            cancellationToken: cancellationToken);
        stopwatch.Stop();

        var usage = response.UsageMetadata;
        return new LlmResponse(
            Text: response.Text ?? "",
            Model: model,
            Latency: stopwatch.Elapsed,
            InputTokens: usage?.PromptTokenCount ?? 0,
            OutputTokens: (usage?.CandidatesTokenCount ?? 0) + (usage?.ThoughtsTokenCount ?? 0));
    }

    /// <summary>Lists models that support text generation (used by the InterviewLab tool).</summary>
    public async Task<IReadOnlyList<string>> ListModelsAsync(CancellationToken cancellationToken = default)
    {
        var names = new List<string>();
        var pager = await Client.Models.ListAsync(cancellationToken: cancellationToken);
        await foreach (var model in pager.WithCancellation(cancellationToken))
        {
            if (model.SupportedActions?.Contains("generateContent") == true && model.Name is not null)
            {
                names.Add(model.Name.Replace("models/", ""));
            }
        }
        return names;
    }
}
