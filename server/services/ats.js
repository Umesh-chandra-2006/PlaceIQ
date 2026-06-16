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

exports.calculateAtsDashboard = (resumeText, jobDescription) => {
  const resumeLower = resumeText.toLowerCase();
  
  // 1. Keywords Score & lists
  let keywordsScore = 70;
  let matchedKeywords = [];
  let missingKeywords = [];
  
  if (jobDescription) {
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
    
    if (filteredKeywords.length > 0) {
      let matched = [];
      let missing = [];
      filteredKeywords.forEach(k => {
        if (checkKeywordMatch(resumeLower, k)) {
          matched.push(k);
        } else {
          missing.push(k);
        }
      });
      matchedKeywords = matched.slice(0, 10);
      missingKeywords = missing.slice(0, 10);
      keywordsScore = Math.round((matched.length / filteredKeywords.length) * 100);
    }
  } else {
    // Default general keywords checks
    const commonTechs = ["react", "node", "express", "mongodb", "python", "javascript", "html", "css", "git", "sql", "java", "c++", "docker", "aws", "typescript", "rest"];
    commonTechs.forEach(t => {
      if (resumeLower.includes(t)) {
        matchedKeywords.push(t);
      } else {
        missingKeywords.push(t);
      }
    });
    matchedKeywords = matchedKeywords.slice(0, 8);
    missingKeywords = missingKeywords.slice(0, 8);
    keywordsScore = matchedKeywords.length > 0 ? Math.round((matchedKeywords.length / (matchedKeywords.length + missingKeywords.length)) * 100) : 50;
  }

  // 2. Formatting Score
  let formattingScore = 40;
  const hasEmail = resumeLower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const hasPhone = resumeLower.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91\s?\d{10}|\d{10}/);
  const hasLinkedIn = resumeLower.includes("linkedin.com") || resumeLower.includes("linkedin");
  const hasGitHub = resumeLower.includes("github.com") || resumeLower.includes("github");
  const hasLocation = resumeLower.includes("india") || resumeLower.includes("bangalore") || resumeLower.includes("delhi") || resumeLower.includes("mumbai") || resumeLower.includes("pune") || resumeLower.includes("hyderabad") || resumeLower.includes("location");

  if (hasEmail) formattingScore += 15;
  if (hasPhone) formattingScore += 15;
  if (hasLinkedIn) formattingScore += 10;
  if (hasGitHub) formattingScore += 10;
  if (hasLocation) formattingScore += 10;
  // Check for clean typography/capitalized section headers
  if (resumeLower.includes("education") && resumeLower.includes("experience")) formattingScore += 10;

  // 3. Experience Score
  let experienceScore = 50;
  const actionVerbs = ["built", "developed", "optimized", "designed", "led", "implemented", "created", "managed", "architected", "integrated", "solved", "reduced", "increased"];
  let verbCount = 0;
  actionVerbs.forEach(v => {
    if (resumeLower.includes(v)) verbCount++;
  });
  experienceScore += Math.min(verbCount * 5, 25);
  // Word count check
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount > 150) experienceScore += 15;
  if (wordCount > 300) experienceScore += 10;

  // 4. Projects Score
  let projectsScore = 50;
  if (resumeLower.includes("project")) projectsScore += 20;
  // Technology descriptions check
  const techBuzzwords = ["react", "node", "express", "mongo", "sql", "api", "tailwind", "python", "django", "flask", "java", "c++", "aws", "docker"];
  let techUsedCount = 0;
  techBuzzwords.forEach(t => {
    if (resumeLower.includes(t)) techUsedCount++;
  });
  projectsScore += Math.min(techUsedCount * 5, 30);

  // 5. Education Score
  let educationScore = 40;
  if (resumeLower.includes("education") || resumeLower.includes("bachelor") || resumeLower.includes("b.tech") || resumeLower.includes("degree")) educationScore += 30;
  if (resumeLower.includes("cgpa") || resumeLower.includes("gpa") || resumeLower.includes("percentage") || resumeLower.includes("%")) educationScore += 20;
  if (resumeLower.includes("school") || resumeLower.includes("college") || resumeLower.includes("university")) educationScore += 10;

  // 6. Overall Weighted Score
  let score = 50;
  if (jobDescription) {
    score = Math.round(
      keywordsScore * 0.4 +
      formattingScore * 0.15 +
      experienceScore * 0.2 +
      projectsScore * 0.15 +
      educationScore * 0.1
    );
  } else {
    score = Math.round(
      keywordsScore * 0.2 +
      formattingScore * 0.2 +
      experienceScore * 0.2 +
      projectsScore * 0.2 +
      educationScore * 0.2
    );
  }

  // 7. Grade mapping
  let grade = "C";
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B+";
  else if (score >= 60) grade = "B";
  else if (score >= 50) grade = "C";
  else grade = "D";

  // 8. Health Insights
  const healthInsights = [];
  if (!hasEmail || !hasPhone) {
    healthInsights.push({ type: "warning", message: "Missing essential contact details (email or phone number)." });
  }
  if (!hasLinkedIn || !hasGitHub) {
    healthInsights.push({ type: "warning", message: "Add your LinkedIn or GitHub profile link to boost recruiter clicks." });
  }
  if (verbCount === 0) {
    healthInsights.push({ type: "warning", message: "Incorporate strong action verbs (e.g. 'optimized', 'led') in descriptions." });
  }
  
  // Check for quantified metrics (numbers/percentages)
  const hasNumbers = resumeText.match(/\d+%/g) || resumeText.match(/\d+x/gi) || resumeText.match(/(\d+\+)/g);
  if (!hasNumbers) {
    healthInsights.push({ type: "warning", message: "Quantify your impact! Add metrics like %, $, or user load numbers." });
  } else {
    healthInsights.push({ type: "success", message: "Good use of quantified achievements and performance metrics." });
  }

  if (wordCount < 180) {
    healthInsights.push({ type: "warning", message: "Resume is too brief. Expand your project scope and descriptions." });
  } else if (wordCount > 700) {
    healthInsights.push({ type: "warning", message: "Resume is lengthy. Aim to trim wordy sentences to fit a single page." });
  } else {
    healthInsights.push({ type: "success", message: "Resume length is well-optimized for a single page layout." });
  }

  if (!resumeLower.includes("cgpa") && !resumeLower.includes("gpa") && !resumeLower.includes("%")) {
    healthInsights.push({ type: "warning", message: "No grade scale (GPA/CGPA) found. Consider adding it to your education." });
  }

  if (formattingScore >= 80) {
    healthInsights.push({ type: "success", message: "ATS-friendly formatting and structural dividers verified." });
  }

  return {
    score,
    grade,
    breakdown: {
      keywords: keywordsScore,
      formatting: formattingScore,
      experience: experienceScore,
      projects: projectsScore,
      education: educationScore
    },
    matchedKeywords,
    missingKeywords,
    healthInsights
  };
};
