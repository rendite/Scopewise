namespace Scopewise.Interview;

/// <summary>The model did not produce a usable result, even after retrying.</summary>
public sealed class InterviewException(string message, Exception? inner = null) : Exception(message, inner);
