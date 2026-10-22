using System.Text.Json;
using System.Text.Json.Serialization;

namespace Scopewise.Interview;

/// <summary>JSON schemas the model's answers must follow (structured output).</summary>
internal static class Schemas
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private static readonly string TopicKeys = string.Join(", ",
        Enum.GetNames<Topic>().Select(n => $"\"{JsonNaming.CamelCase(n)}\""));

    private const string CoverageValue = """{ "type": "string", "enum": ["missing", "partial", "covered"] }""";

    private const string StringList = """{ "type": "array", "items": { "type": "string" } }""";

    // "coverage" comes first so the model assesses the conversation before choosing a question.
    public static readonly string Step = $$"""
        {
          "type": "object",
          "properties": {
            "coverage": {
              "type": "object",
              "properties": {
                {{string.Join(",\n", Enum.GetNames<Topic>().Select(n => $"\"{JsonNaming.CamelCase(n)}\": {CoverageValue}"))}}
              },
              "required": [{{TopicKeys}}]
            },
            "done": { "type": "boolean" },
            "question": { "type": "string", "description": "The next question, or an empty string when done." },
            "hint": { "type": "string", "description": "Optional helper line under the question, or an empty string." }
          },
          "required": ["coverage", "done", "question", "hint"]
        }
        """;

    public static readonly string Briefing = $$"""
        {
          "type": "object",
          "properties": {
            "summary": { "type": "string" },
            {{string.Join(",\n", Enum.GetNames<Topic>().Select(n => $"\"{JsonNaming.CamelCase(n)}\": {StringList}"))}},
            "openQuestions": {{StringList}}
          },
          "required": ["summary", {{TopicKeys}}, "openQuestions"]
        }
        """;
}
