import { StorageService } from "./storage.service.js";
import { Readable } from "stream";
import { randomUUID } from "crypto";

/**
 * UserStorageService provides user-specific storage operations
 * Organizes files by user ID with proper path sanitization
 */
export class UserStorageService {
  private storage: StorageService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  /**
   * Create a new UserStorageService from environment variables
   */
  static fromEnv(): UserStorageService {
    return new UserStorageService(StorageService.fromEnv());
  }

  /**
   * Sanitize a path segment by replacing slashes and trimming whitespace
   */
  private safeSeg(seg: string): string {
    return seg
      .trim()
      .replace(/[\/\\]/g, "_");
  }

  /**
   * Generate a unique key for a user's resume file
   * Format: users/<userId>/resumes/<uuid>.<ext>
   */
  private resumeKey(userId: string, ext: string): string {
    const safeUserId = this.safeSeg(userId);
    const uuid = randomUUID();
    return `users/${safeUserId}/resumes/${uuid}.${ext}`;
  }

  /**
   * Generate a key for any user file
   * Format: users/<userId>/<folder>/<filename>
   */
  private userFileKey(userId: string, folder: string, filename: string): string {
    const safeUserId = this.safeSeg(userId);
    const safeFolder = this.safeSeg(folder);
    return `users/${safeUserId}/${safeFolder}/${filename}`;
  }

  /**
   * Detect size of content if possible
   */
  private detectSize(content: any): number {
    if (Buffer.isBuffer(content)) {
      return content.length;
    }
    if (typeof content === "string") {
      return Buffer.byteLength(content);
    }
    if (content instanceof Readable) {
      // Try to get size from readable stream if available
      const readable = content as any;
      if (readable.readableLength !== undefined) {
        return readable.readableLength;
      }
    }
    return -1; // Unknown size
  }

  /**
   * Upload a PDF file for a user
   * @param userId User ID (required)
   * @param content Readable stream or Buffer
   * @param filename Optional custom filename (auto-generated if not provided)
   * @returns Object key in storage
   */
  async uploadPDF(
    userId: string,
    content: Readable | Buffer,
    filename?: string
  ): Promise<string> {
    if (!userId || userId.trim() === "") {
      throw new Error("userId is required");
    }

    const objectKey = filename
      ? this.userFileKey(userId, "resumes", filename)
      : this.resumeKey(userId, "pdf");

    return await this.storage.uploadReader(
      "",
      objectKey,
      content,
      "application/pdf"
    );
  }

  /**
   * Upload PDF from bytes
   */
  async uploadPDFBytes(userId: string, bytes: Buffer): Promise<string> {
    return this.uploadPDF(userId, bytes);
  }

  /**
   * Upload a DOCX file for a user
   * @param userId User ID (required)
   * @param content Readable stream or Buffer
   * @param filename Optional custom filename (auto-generated if not provided)
   * @returns Object key in storage
   */
  async uploadDOCX(
    userId: string,
    content: Readable | Buffer,
    filename?: string
  ): Promise<string> {
    if (!userId || userId.trim() === "") {
      throw new Error("userId is required");
    }

    const objectKey = filename
      ? this.userFileKey(userId, "resumes", filename)
      : this.resumeKey(userId, "docx");

    return await this.storage.uploadReader(
      "",
      objectKey,
      content,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  }

  /**
   * Upload DOCX from bytes
   */
  async uploadDOCXBytes(userId: string, bytes: Buffer): Promise<string> {
    return this.uploadDOCX(userId, bytes);
  }

  /**
   * Upload any file for a user
   * @param userId User ID
   * @param folder Folder name (e.g., "resumes", "documents", "images")
   * @param filename Filename with extension
   * @param content File content
   * @param contentType MIME type
   * @returns Object key in storage
   */
  async uploadUserFile(
    userId: string,
    folder: string,
    filename: string,
    content: Readable | Buffer | string,
    contentType?: string
  ): Promise<string> {
    if (!userId || userId.trim() === "") {
      throw new Error("userId is required");
    }

    const objectKey = this.userFileKey(userId, folder, filename);
    return await this.storage.uploadReader("", objectKey, content, contentType);
  }

  /**
   * Download file data as Buffer
   */
  async downloadData(objectKey: string): Promise<Buffer> {
    return await this.storage.downloadData(objectKey);
  }

  /**
   * Download file to local path
   */
  async downloadToFile(objectKey: string, destPath: string): Promise<void> {
    return await this.storage.downloadToFile(objectKey, destPath);
  }

  /**
   * Generate a presigned download URL
   * @param objectKey Path to the object
   * @param expiryMs Expiration time in milliseconds (default: 15 minutes)
   * @returns Signed URL for downloading
   */
  async downloadURL(
    objectKey: string,
    expiryMs: number = 15 * 60 * 1000
  ): Promise<string> {
    return await this.storage.presignGetURL(objectKey, expiryMs);
  }

  /**
   * Generate a presigned upload URL for client-side uploads
   * @param userId User ID
   * @param folder Folder name
   * @param filename Filename with extension
   * @param contentType MIME type
   * @param expiryMs Expiration time in milliseconds (default: 15 minutes)
   * @returns Object key and signed URL for uploading
   */
  async uploadURL(
    userId: string,
    folder: string,
    filename: string,
    contentType: string,
    expiryMs: number = 15 * 60 * 1000
  ): Promise<{ objectKey: string; uploadURL: string }> {
    if (!userId || userId.trim() === "") {
      throw new Error("userId is required");
    }

    const objectKey = this.userFileKey(userId, folder, filename);
    const uploadURL = await this.storage.presignPutURL(
      objectKey,
      expiryMs,
      contentType
    );

    return { objectKey, uploadURL };
  }

  /**
   * Delete a user's file
   */
  async deleteFile(objectKey: string): Promise<void> {
    return await this.storage.delete(objectKey);
  }

  /**
   * Check if a file exists
   */
  async fileExists(objectKey: string): Promise<boolean> {
    return await this.storage.exists(objectKey);
  }

  /**
   * List all files for a user
   * @param userId User ID
   * @param folder Optional folder to filter (e.g., "resumes")
   * @returns List of file information
   */
  async listUserFiles(
    userId: string,
    folder?: string
  ): Promise<Array<{ name: string; size: number; updated: Date }>> {
    const safeUserId = this.safeSeg(userId);
    const prefix = folder
      ? `users/${safeUserId}/${this.safeSeg(folder)}/`
      : `users/${safeUserId}/`;

    return await this.storage.listFiles(prefix);
  }

  /**
   * Upload a public file for a user (accessible without authentication)
   * @param userId User ID
   * @param folder Folder name
   * @param filename Filename
   * @param content File content
   * @param contentType MIME type
   * @returns Public URL and object key
   */
  async uploadPublicFile(
    userId: string,
    folder: string,
    filename: string,
    content: Readable | Buffer | string,
    contentType?: string
  ): Promise<{ publicURL: string; objectKey: string }> {
    if (!userId || userId.trim() === "") {
      throw new Error("userId is required");
    }

    const safeUserId = this.safeSeg(userId);
    const safeFolder = this.safeSeg(folder);
    const prefix = `users/${safeUserId}/${safeFolder}`;

    return await this.storage.uploadPublic(prefix, filename, content, contentType);
  }
}
