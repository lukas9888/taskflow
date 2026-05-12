namespace TaskFlow.API.Helpers;

public static class TaskFlowNormalization
{
    /// <summary>
    /// Normalizes a category name: trims whitespace, uppercases (invariant),
    /// and truncates to 64 characters. Returns null for null/empty/whitespace input.
    /// </summary>
    public static string? NormalizeCategory(string? c)
    {
        if (string.IsNullOrWhiteSpace(c))
            return null;

        var t = c.Trim().ToUpperInvariant();
        return t.Length > 64 ? t[..64] : t;
    }
}