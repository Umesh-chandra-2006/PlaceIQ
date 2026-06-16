const { uploadFile, isCloudinaryActive } = require("../../services/storageService");

describe("Storage Service", () => {
  it("should block disallowed file types", async () => {
    await expect(uploadFile(Buffer.from(""), "malicious.exe", "resumes", "123"))
      .rejects.toThrow("File type .exe not allowed");
  });

  it("should sanitize filenames and save locally when Cloudinary is not configured", async () => {
    const url = await uploadFile(Buffer.from("pdf-data"), "resume/../../file.pdf", "resumes", "123");
    expect(url).toContain("/uploads/resumes-123-");
    expect(url).toContain(".pdf");
    expect(url).not.toContain("..");
  });
});
