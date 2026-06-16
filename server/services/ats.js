const axios = require("axios");
const keywordExtractor = require("keyword-extractor");

// Synonym mapping to improve ATS keyword matching accuracy
const SYNONYMS = {
  "js": ["javascript"],
  "javascript": ["js"],
  "ts": ["typescript"],
  "typescript": ["ts"],
  "py": ["python"],
  "python": ["py"],
  "ml": ["machine learning"],
  "machine learning": ["ml"],
  "ai": ["artificial intelligence"],
  "artificial intelligence": ["ai"],
  "aws": ["amazon web services"],
  "amazon web services": ["aws"],
  "gcp": ["google cloud platform"],
  "google cloud platform": ["gcp"],
  "k8s": ["kubernetes"],
  "kubernetes": ["k8s"],
  "ci/cd": ["continuous integration", "ci-cd"],
  "continuous integration": ["ci/cd", "ci-cd"]
};

/**
 * Checks if a keyword matches the resume, taking synonyms into account.
 */
const checkKeywordMatch = (resumeLower, keyword) => {
  const kw = keyword.toLowerCase();
  if (resumeLower.includes(kw)) return true;

  const syns = SYNONYMS[kw];
  if (syns) {
    for (const syn of syns) {
      if (resumeLower.includes(syn)) return true;
    }
  }
  return false;
};

exports.calculateRuleBasedScore = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) return 0;
  
  // Extract keywords from Job Description
  const jdKeywords = keywordExtractor.extract(jobDescription, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true
  });
  
  const genericWords = new Set([
    "required", "looking", "experience", "years", "work", "engineering", 
    "candidate", "role", "team", "strong", "good", "ability", "skills", 
    "job", "position", "company", "description", "plus", "must", "have", 
    "with", "from", "their", "will", "this", "that", "highly", "successful",
    "excel", "excellent", "written", "verbal", "communication", "working"
  ]);
  
  const filteredKeywords = jdKeywords.filter(k => k.length > 2 && !genericWords.has(k.toLowerCase()));
  
  if (filteredKeywords.length === 0) return 0;

  const resumeLower = resumeText.toLowerCase();
  
  let matchCount = 0;
  filteredKeywords.forEach(keyword => {
    if (checkKeywordMatch(resumeLower, keyword)) {
      matchCount++;
    }
  });

  const rawScore = (matchCount / filteredKeywords.length) * 100;
  return Math.round(rawScore);
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
      const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
      
      const jdKeywords = keywordExtractor.extract(jobDescription, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true
      });
      
      const genericWords = new Set([
        "required", "looking", "experience", "years", "work", "engineering", 
        "candidate", "role", "team", "strong", "good", "ability", "skills", 
        "job", "position", "company", "description", "plus", "must", "have", 
        "with", "from", "their", "will", "this", "that", "highly", "successful",
        "excel", "excellent", "written", "verbal", "communication", "working"
      ]);
      
      const filteredKeywords = jdKeywords.filter(k => k.length > 2 && !genericWords.has(k.toLowerCase()));
      const resumeLower = resumeText.toLowerCase();
      const matchedKeywords = filteredKeywords.filter(k => checkKeywordMatch(resumeLower, k)).slice(0, 8);
      const missingKeywords = filteredKeywords.filter(k => !checkKeywordMatch(resumeLower, k)).slice(0, 8);
      
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
