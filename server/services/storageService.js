/**
 * Storage Service
 * Handles uploading file buffers to Cloudinary (in production/when configured)
 * or a local uploads folder (for development and backup fallback).
 */
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");
const { ALLOWED_FILE_EXTENSIONS } = require("../config/constants");

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
  console.log("Storage Service: Cloudinary configured successfully.");
} else {
  console.log("Storage Service: Cloudinary env variables missing. Falling back to local storage.");
}

/**
 * Uploads a file buffer to Cloudinary or local filesystem.
 * 
 * @param {Buffer} fileBuffer - File contents buffer
 * @param {string} originalName - Original uploaded filename
 * @param {string} prefix - Folder prefix (e.g. 'resumes' or 'offers')
 * @param {string} customId - Entity identifier (e.g. userId or applicationId)
 * @returns {Promise<string>} - The public URL or path of the uploaded file
 */
const uploadFile = async (fileBuffer, originalName, prefix, customId) => {
  // Sanitize filename to prevent path traversal
  const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const extension = path.extname(safeName) || ".pdf";

  // Validate extension
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension.toLowerCase())) {
    throw new Error(`File type ${extension} not allowed. Allowed: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`);
  }

  const uniqueName = `${prefix}-${customId}-${Date.now()}${extension}`;

  if (isCloudinaryConfigured) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `placeiq/${prefix}`,
            public_id: uniqueName.replace(extension, ""), // Cloudinary strips extension from public_id when uploading
            resource_type: "raw",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error, attempting local backup:", err);
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
  isCloudinaryActive: () => isCloudinaryConfigured,
  isS3Active: () => isCloudinaryConfigured, // Backwards compatibility if needed
};
