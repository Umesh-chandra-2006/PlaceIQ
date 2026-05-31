/**
 * Storage Service
 * Handles uploading file buffers to either AWS S3 (in production) 
 * or a local uploads folder (for development and backup fallback).
 */
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");

let s3Client = null;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;

if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  bucketName &&
  region
) {
  s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log("Storage Service: AWS S3 client configured successfully.");
} else {
  console.log("Storage Service: AWS S3 env variables missing. Falling back to local storage.");
}

/**
 * Uploads a file buffer to AWS S3 or local filesystem.
 * 
 * @param {Buffer} fileBuffer - File contents buffer
 * @param {string} originalName - Original uploaded filename
 * @param {string} prefix - Folder prefix (e.g. 'resumes' or 'offers')
 * @param {string} customId - Entity identifier (e.g. userId or applicationId)
 * @returns {Promise<string>} - The public URL or path of the uploaded file
 */
const uploadFile = async (fileBuffer, originalName, prefix, customId) => {
  const extension = path.extname(originalName) || ".pdf";
  const uniqueName = `${prefix}-${customId}-${Date.now()}${extension}`;

  if (s3Client) {
    const key = `${prefix}/${uniqueName}`;
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: "application/pdf",
        })
      );
      // Return public S3 URL
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    } catch (err) {
      console.error("AWS S3 Upload Error, attempting local backup:", err);
      // Fallback to local if S3 fails
      return saveLocally(fileBuffer, uniqueName);
    }
  } else {
    return saveLocally(fileBuffer, uniqueName);
  }
};

/**
 * Helper to save buffer to local uploads directory.
 */
const saveLocally = async (buffer, uniqueName) => {
  const uploadDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, uniqueName);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${uniqueName}`;
};

module.exports = {
  uploadFile,
  isS3Active: () => !!s3Client,
};
