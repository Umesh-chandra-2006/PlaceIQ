/**
 * S3 Upload Verification Script
 * Run: node server/scripts/test_s3_upload.js
 */
require("dotenv").config();
const { uploadFile, isS3Active } = require("../services/storageService");

const runTest = async () => {
  console.log("=== PLACEIQ STORAGE SERVICE TEST ===");
  console.log("Is S3 Active (using environment variables)?:", isS3Active());
  
  const dummyBuffer = Buffer.from("%PDF-1.4 dummy PDF file structure content for testing.");
  const originalName = "test-document.pdf";
  const prefix = "testing";
  const customId = "mock-id-12345";

  try {
    console.log("Starting upload...");
    const url = await uploadFile(dummyBuffer, originalName, prefix, customId);
    console.log("Upload finished successfully!");
    console.log("Returned File URL:", url);
    
    if (url.startsWith("http")) {
      console.log("SUCCESS: File uploaded to cloud (S3 / backup).");
    } else {
      console.log("SUCCESS: File uploaded locally on disk (Fallback mode).");
    }
  } catch (err) {
    console.error("Test Failed with Error:", err);
  }
};

runTest();
