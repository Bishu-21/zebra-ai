/**
 * Upload File Safety Utility
 * 
 * Validates file sizes, MIME types, and file extensions for uploaded resumes and attachments.
 */

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export const ALLOWED_RESUME_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
];

export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];

export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateUploadedFile(
    fileSize: number,
    mimeType: string,
    filename: string,
    maxSizeBytes: number = MAX_RESUME_FILE_SIZE_BYTES
): FileValidationResult {
    if (fileSize <= 0) {
        return { valid: false, error: "Uploaded file cannot be empty." };
    }

    if (fileSize > maxSizeBytes) {
        const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        return { valid: false, error: `File size exceeds the maximum permitted limit of ${sizeMb}MB.` };
    }

    const cleanMime = (mimeType || "").toLowerCase().trim();
    if (!ALLOWED_RESUME_MIME_TYPES.includes(cleanMime)) {
        return { 
            valid: false, 
            error: "Unsupported file type. Only PDF, DOCX, DOC, and TXT files are allowed." 
        };
    }

    const cleanFilename = (filename || "").toLowerCase().trim();
    const hasValidExtension = ALLOWED_RESUME_EXTENSIONS.some((ext) => cleanFilename.endsWith(ext));
    if (!hasValidExtension) {
        return { 
            valid: false, 
            error: "Invalid file extension. Only .pdf, .docx, .doc, and .txt files are permitted." 
        };
    }

    return { valid: true };
}
