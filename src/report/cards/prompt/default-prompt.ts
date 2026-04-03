/**
 * Default prompt template used when no custom prompt file is embedded in the report.
 */
export const DEFAULT_PROMPT = `
You are analyzing a Playwright timeline report.
Use the JSON below as the source of truth. All time values are in seconds.
Focus on the longest tests, repeated or expensive fixtures, hook overhead, retries, 
restarts, and worker imbalance across worker lanes.
Base conclusions on the timings in the JSON. If evidence is weak, say so explicitly.

Return:
1. A short executive summary.
2. The top bottlenecks ranked by impact, with evidence from the JSON.
3. The most actionable optimization steps for this Playwright suite.

Report JSON:
\`\`\`json
{data}
\`\`\`
`.trim();
