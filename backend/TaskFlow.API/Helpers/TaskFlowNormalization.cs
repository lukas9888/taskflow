namespace TaskFlow.API.Helpers;

public static class TaskFlowNormalization
{
    public static string? NormalizeCategory(string? c)
    {
        if (string.IsNullOrWhiteSpace(c))
            return null;

        var t = c.Trim().ToUpperInvariant();
        return t.Length > 64 ? t[..64] : t;
    }
}