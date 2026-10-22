using System.Text;
using Scopewise.Interview;

namespace Scopewise.InterviewLab;

public static class Markdown
{
    public static string Briefing(Briefing briefing)
    {
        var md = new StringBuilder($"## Briefing\n\n{briefing.Summary}\n");
        foreach (var section in briefing.Sections)
        {
            md.Append($"\n### {section.Title}\n\n");
            md.Append(section.Items.Count == 0 ? "_Nothing mentioned._\n" : string.Concat(section.Items.Select(i => $"- {i}\n")));
        }
        md.Append("\n### Open questions\n\n");
        md.Append(briefing.OpenQuestions.Count == 0 ? "_None._\n" : string.Concat(briefing.OpenQuestions.Select(q => $"- {q}\n")));
        return md.ToString();
    }
}
