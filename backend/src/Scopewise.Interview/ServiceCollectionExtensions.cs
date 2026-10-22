using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Scopewise.Interview.Llm;

namespace Scopewise.Interview;

public static class ServiceCollectionExtensions
{
    /// <summary>Registers the interview engine, briefing generator and the Gemini client.</summary>
    public static IServiceCollection AddInterview(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<InterviewOptions>(configuration.GetSection(InterviewOptions.SectionName));
        services.Configure<GeminiOptions>(gemini =>
        {
            configuration.GetSection(GeminiOptions.SectionName).Bind(gemini);
            gemini.ApiKey ??= configuration["GEMINI_API_KEY"];
        });
        services.AddSingleton<GeminiLlmClient>();
        services.AddSingleton<ILlmClient>(sp => sp.GetRequiredService<GeminiLlmClient>());
        services.AddSingleton<InterviewEngine>();
        services.AddSingleton<BriefingGenerator>();
        return services;
    }
}
