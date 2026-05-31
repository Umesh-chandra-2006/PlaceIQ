const axios = require('axios');
const keywordExtractor = require('keyword-extractor');

exports.calculateRuleBasedScore = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) return 0;
  
  // Extract keywords from Job Description
  const jdKeywords = keywordExtractor.extract(jobDescription, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true
  });
  
  if (jdKeywords.length === 0) return 0;

  const resumeLower = resumeText.toLowerCase();
  
  let matchCount = 0;
  jdKeywords.forEach(keyword => {
    if (resumeLower.includes(keyword)) {
      matchCount++;
    }
  });

  const rawScore = (matchCount / jdKeywords.length) * 100;
  // Boost score slightly but cap at 100
  return Math.min(Math.round(rawScore * 1.5), 100);
};

exports.performAiReview = async (resumeText, jobDescription) => {
  const prompt = `
You are an expert ATS (Applicant Tracking System) and senior recruiter.
I will provide you with a Job Description and a Candidate's Resume.

Your task is to analyze the resume against the job description and provide a strict JSON response.
Do NOT output any markdown blocks or conversational text, just valid JSON.

Format required:
{
  "score": <number 0-100>,
  "grade": "<A, B, C, D, or F>",
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "suggestion": "<One actionable sentence to improve the resume for this job>"
}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;

  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "google/gemini-2.5-flash", // High quality model for JSON
      messages: [
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const content = response.data.choices[0].message.content;
    
    // Extract JSON in case the model adds backticks
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response from AI");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn("OpenRouter AI Review failed, falling back to rule-based analysis:", error.response?.data || error.message);
    
    try {
      const score = exports.calculateRuleBasedScore(resumeText, jobDescription);
      const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F';
      
      const jdKeywords = keywordExtractor.extract(jobDescription, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true
      });
      
      const resumeLower = resumeText.toLowerCase();
      const matchedKeywords = jdKeywords.filter(k => resumeLower.includes(k.toLowerCase())).slice(0, 8);
      const missingKeywords = jdKeywords.filter(k => !resumeLower.includes(k.toLowerCase())).slice(0, 8);
      
      return {
        score,
        grade,
        matchedKeywords,
        missingKeywords,
        suggestion: "AI API limit reached. Resorted to dynamic rule-based keyword match analysis. Expand your resume with the missing keywords to improve the score."
      };
    } catch (fallbackError) {
      console.error("Critical fallback calculation failure:", fallbackError);
      throw new Error("Failed to perform ATS review");
    }
  }
};
