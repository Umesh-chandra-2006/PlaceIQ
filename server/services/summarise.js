/**
 * Service to summarize Job Descriptions using OpenRouter API.
 * Includes a fallback if the API key is missing.
 */

async function summariseJD(description) {
  if (!process.env.OPENROUTER_API_KEY) {
    return [
      "AI summary unavailable — add ANTHROPIC_API_KEY to .env to enable",
      "",
      ""
    ];
  }

  try {
    const { OpenRouter } = await import("@openrouter/sdk");
    const client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "nvidia/nemotron-3-super",
      messages: [{
        role: "user",
        content: `Summarise this job description in exactly 3 short bullets.
Each bullet max 12 words. Focus on: role type, required stack, key eligibility condition.
No preamble. No numbering. Just 3 lines starting with "•".

JD:
${description}`
      }]
    });

    const raw = completion.choices[0].message.content;
    return raw.split("\n")
      .filter(l => l.trim().startsWith("•"))
      .map(l => l.replace(/^•\s*/, "").trim())
      .slice(0, 3);
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return [
      "AI summary unavailable — add ANTHROPIC_API_KEY to .env to enable",
      "",
      ""
    ];
  }
}

module.exports = { summariseJD };
