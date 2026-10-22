namespace Scopewise.InterviewLab;

/// <summary>Minimal "--name value" parser.</summary>
public sealed class Args
{
    private readonly Dictionary<string, string> _values = new(StringComparer.OrdinalIgnoreCase);

    public static Args Parse(IEnumerable<string> args)
    {
        var result = new Args();
        string? name = null;
        foreach (var arg in args)
        {
            if (arg.StartsWith("--"))
            {
                name = arg[2..];
                result._values[name] = "";
            }
            else if (name is not null)
            {
                result._values[name] = arg;
                name = null;
            }
        }
        return result;
    }

    public string? Get(string name) => _values.TryGetValue(name, out var value) && value.Length > 0 ? value : null;

    public string[] GetList(string name) =>
        Get(name)?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];

    public int GetInt(string name, int fallback) => int.TryParse(Get(name), out var value) ? value : fallback;
}
