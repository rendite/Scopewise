using System.Net;
using System.Reflection;
using System.Text;

namespace Scopewise.Interview;

/// <summary>Loads the prompt files from Prompts/ and fills in their {{placeholders}}.</summary>
public static class PromptLibrary
{
    public static string InterviewerSystemPrompt(InterviewContext context) =>
        Fill(Load("interviewer.md"), context)
            .Replace("{{topics}}", Load($"topics/{ProjectTypes.Key(context.ProjectType)}.md").Trim())
            .Replace("{{startLanguage}}", context.StartLanguage);

    public static string BriefingSystemPrompt(InterviewContext context) => Fill(Load("briefing.md"), context);

    /// <summary>
    /// Renders the conversation for the model. Client answers are HTML-encoded so
    /// they cannot close the tags and pose as instructions.
    /// </summary>
    public static string Transcript(IReadOnlyList<InterviewTurn> turns)
    {
        var builder = new StringBuilder("<transcript>\n");
        for (var i = 0; i < turns.Count; i++)
        {
            builder.Append($"<turn number=\"{i + 1}\">\n")
                .Append($"<question>{WebUtility.HtmlEncode(turns[i].Question)}</question>\n")
                .Append($"<answer>{WebUtility.HtmlEncode(turns[i].Answer)}</answer>\n")
                .Append("</turn>\n");
        }
        return builder.Append("</transcript>").ToString();
    }

    private static string Fill(string template, InterviewContext context) => template
        .Replace("{{agencyName}}", context.AgencyName)
        .Replace("{{clientName}}", context.ClientName)
        .Replace("{{projectType}}", ProjectTypes.Label(context.ProjectType));

    private static string Load(string name)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream($"Prompts/{name}")
            ?? throw new InvalidOperationException($"Prompt file Prompts/{name} not found.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

public static class ProjectTypes
{
    /// <summary>camelCase key as used in the API and the topic file names.</summary>
    public static string Key(ProjectType type) => JsonNaming.CamelCase(type.ToString());

    public static string Label(ProjectType type) => type switch
    {
        ProjectType.Website => "website",
        ProjectType.Webshop => "online shop",
        ProjectType.Webapp => "web app",
        ProjectType.MobileApp => "mobile app",
        _ => "custom software solution",
    };
}

internal static class JsonNaming
{
    public static string CamelCase(string name) => char.ToLowerInvariant(name[0]) + name[1..];
}
