const { calculateRuleBasedScore } = require("../../services/ats");

describe("ATS Service - calculateRuleBasedScore", () => {
  it("should return 0 if either text is missing", () => {
    expect(calculateRuleBasedScore("", "Job Description")).toBe(0);
    expect(calculateRuleBasedScore("Resume Text", "")).toBe(0);
  });

  it("should calculate correct match score for exact matches", () => {
    const jd = "Looking for a software engineer with expertise in Node.js, React, and MongoDB.";
    const resume = "Experienced developer specialized in React, Node.js, and MongoDB database systems.";
    
    const score = calculateRuleBasedScore(resume, jd);
    expect(score).toBeGreaterThan(0);
  });

  it("should handle synonym mapping (e.g. JS -> Javascript, AI -> Artificial Intelligence)", () => {
    const jd = "Seeking an engineer with expertise in Javascript and Artificial Intelligence.";
    const resume = "I work with JS, node, and AI technologies.";

    const score = calculateRuleBasedScore(resume, jd);
    expect(score).toBeGreaterThan(0);
  });
});
