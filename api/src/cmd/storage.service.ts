import { Storage, Bucket, File } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

interface StorageConfig {
  projectId: string;
  bucket: string;
  publicBucket?: string;
  publicBucketURL?: string;
  keyFilename?: string;
}

/*
GCP_PROJECT_ID (required)
GCP_BUCKET_NAME (required)
GCP_PUBLIC_BUCKET_NAME (optional)
GCP_PUBLIC_BUCKET_URL (optional)
*/

export class StorageService {
  private storage: Storage;
  private bucket: string;
  private publicBucket: string;
  private publicBucketURL?: string;
  private bucketInstance: Bucket;
  private publicBucketInstance: Bucket;

  constructor(config: StorageConfig) {
    this.storage = new Storage({
      projectId: config.projectId
    });

    this.bucket = config.bucket;
    this.publicBucket = config.publicBucket || config.bucket;
    this.publicBucketURL = config.publicBucketURL;

    this.bucketInstance = this.storage.bucket(this.bucket);
    this.publicBucketInstance = this.storage.bucket(this.publicBucket);
  }

  /**
   * Create a new StorageService instance from environment variables
   */
  static fromEnv(): StorageService {
    const projectId = process.env.GCP_PROJECT_ID;
    const bucket = process.env.GCP_BUCKET_NAME;
    const publicBucket = process.env.GCP_PUBLIC_BUCKET_NAME;
    const publicBucketURL = process.env.GCP_PUBLIC_BUCKET_URL;

    if (!projectId) {
      throw new Error("GCP_PROJECT_ID environment variable is required");
    }
    if (!bucket) {
      throw new Error("GCP_BUCKET_NAME environment variable is required");
    }

    return new StorageService({
      projectId,
      bucket,
      publicBucket,
      publicBucketURL
    });
  }

  /**
   * Join path segments to create a clean object key
   * Example: joinPath("users/42", "resume.pdf") => "users/42/resume.pdf"
   */
  static joinPath(prefix: string, name: string): string {
    prefix = prefix.replace(/^\/+|\/+$/g, "");
    name = name.replace(/^\/+/, "");
    if (!prefix) {
      return name;
    }
    return `${prefix}/${name}`;
  }

  /**
   * Upload a local file to the bucket
   * @param prefix Folder/path prefix for organization
   * @param localPath Path to the local file
   * @param contentType MIME type of the file
   * @returns Object key (path) in the bucket
   */
  async uploadFile(
    prefix: string,
    localPath: string,
    contentType?: string
  ): Promise<string> {
    const base = path.basename(localPath);
    const objectKey = StorageService.joinPath(prefix, base);

    const options: any = {
      destination: objectKey,
      metadata: {
        contentType: contentType,
      },
    };

    await this.bucketInstance.upload(localPath, options);
    return objectKey;
  }

  /**
   * Upload from a readable stream or buffer
   * @param prefix Folder/path prefix
   * @param objectName Name for the object
   * @param content Readable stream, Buffer, or string
   * @param contentType MIME type
   * @returns Object key in the bucket
   */
  async uploadReader(
    prefix: string,
    objectName: string,
    content: Readable | Buffer | string,
    contentType?: string
  ): Promise<string> {
    const objectKey = StorageService.joinPath(prefix, objectName);
    const file = this.bucketInstance.file(objectKey);

    const options: any = {
      metadata: {
        contentType: contentType,
      },
    };

    if (content instanceof Readable) {
      await new Promise((resolve, reject) => {
        const writeStream = file.createWriteStream(options);
        content.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    } else {
      await file.save(content, options);
    }

    return objectKey;
  }

  /**
   * Upload string content directly
   */
  async uploadContent(
    prefix: string,
    objectName: string,
    content: string,
    contentType?: string
  ): Promise<string> {
    return this.uploadReader(prefix, objectName, content, contentType);
  }

  /**
   * Upload bytes directly
   */
  async uploadBytes(
    prefix: string,
    objectName: string,
    bytes: Buffer,
    contentType?: string
  ): Promise<string> {
    return this.uploadReader(prefix, objectName, bytes, contentType);
  }

  /**
   * Generate a signed URL for downloading (GET)
   * @param objectKey Path to the object in the bucket
   * @param expiryMs Expiration time in milliseconds
   * @returns Signed URL
   */
  async presignGetURL(objectKey: string, expiryMs: number): Promise<string> {
    const file = this.bucketInstance.file(objectKey);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expiryMs,
    });
    return url;
  }

  /**
   * Generate a signed URL for uploading (PUT)
   * @param objectKey Path to the object in the bucket
   * @param expiryMs Expiration time in milliseconds
   * @param contentType Optional content type for the upload
   * @returns Signed URL
   */
  async presignPutURL(
    objectKey: string,
    expiryMs: number,
    contentType?: string
  ): Promise<string> {
    const file = this.bucketInstance.file(objectKey);
    const options: any = {
      action: "write",
      expires: Date.now() + expiryMs,
      contentType: contentType,
    };

    const [url] = await file.getSignedUrl(options);
    return url;
  }

  /**
   * Delete an object from the bucket
   */
  async delete(objectKey: string): Promise<void> {
    const file = this.bucketInstance.file(objectKey);
    await file.delete();
  }

  /**
   * Check if an object exists in the bucket
   */
  async exists(objectKey: string): Promise<boolean> {
    const file = this.bucketInstance.file(objectKey);
    const [exists] = await file.exists();
    return exists;
  }

  /**
   * Download object data as a Buffer
   */
  async downloadData(objectKey: string): Promise<Buffer> {
    const file = this.bucketInstance.file(objectKey);
    const [contents] = await file.download();
    return contents;
  }

  /**
   * Download object to a local file
   */
  async downloadToFile(objectKey: string, destPath: string): Promise<void> {
    const file = this.bucketInstance.file(objectKey);
    
    // Create directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    await file.download({ destination: destPath });
  }

  /**
   * Upload a file with public-read access
   * @param prefix Folder/path prefix (default: "public")
   * @param objectName Name for the object
   * @param content Readable stream, Buffer, or string
   * @param contentType MIME type
   * @returns Public URL and object key
   */
  async uploadPublic(
    prefix: string,
    objectName: string,
    content: Readable | Buffer | string,
    contentType?: string
  ): Promise<{ publicURL: string; objectKey: string }> {
    const usePrefix = prefix || "public";
    const objectKey = StorageService.joinPath(usePrefix, objectName);

    // Check if file already exists
    const exists = await this.exists(objectKey);
    if (exists) {
      console.warn(
        `⚠️  WARNING: Overwriting existing file at ${this.publicBucket}/${objectKey}`
      );
    }

    const file = this.publicBucketInstance.file(objectKey);

    const options: any = {
      metadata: {
        contentType: contentType,
      },
      public: true,
    };

    if (content instanceof Readable) {
      await new Promise((resolve, reject) => {
        const writeStream = file.createWriteStream(options);
        content.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    } else {
      await file.save(content, options);
    }

    // Make the file publicly accessible
    await file.makePublic();

    const publicURL = this.getPublicURLForBucket(this.publicBucket, objectKey);
    return { publicURL, objectKey };
  }

  /**
   * Upload a local file with public access
   */
  async uploadPublicFile(
    prefix: string,
    localPath: string,
    contentType?: string
  ): Promise<{ publicURL: string; objectKey: string }> {
    const objectName = path.basename(localPath);
    const content = fs.readFileSync(localPath);
    return this.uploadPublic(prefix, objectName, content, contentType);
  }

  /**
   * Upload bytes with public access
   */
  async uploadPublicBytes(
    prefix: string,
    objectName: string,
    bytes: Buffer,
    contentType?: string
  ): Promise<{ publicURL: string; objectKey: string }> {
    return this.uploadPublic(prefix, objectName, bytes, contentType);
  }

  /**
   * Get the direct public URL for an object (no expiry, no signature)
   * Only works for objects with public-read access
   */
  getPublicURL(objectKey: string): string {
    return this.getPublicURLForBucket(this.bucket, objectKey);
  }

  /**
   * Get the direct public URL for a specific bucket
   */
  getPublicURLForBucket(bucket: string, objectKey: string): string {
    // If custom public URL is configured and this is the public bucket
    if (this.publicBucketURL && bucket === this.publicBucket) {
      return `${this.publicBucketURL.replace(/\/$/, "")}/${objectKey}`;
    }

    // Default GCS public URL format
    return `https://storage.googleapis.com/${bucket}/${objectKey}`;
  }

  /**
   * List files in the bucket with optional prefix
   */
  async listFiles(prefix?: string): Promise<Array<{ name: string; size: number; updated: Date }>> {
    const options: any = {};
    if (prefix) {
      options.prefix = prefix.replace(/^\/+/, "");
    }

    const [files] = await this.bucketInstance.getFiles(options);
    
    return files.map((file) => ({
      name: file.name,
      size: parseInt(String(file.metadata.size || "0")),
      updated: new Date(file.metadata.updated || Date.now()),
    }));
  }

  /**
   * Get metadata for an object
   */
  async getMetadata(objectKey: string): Promise<any> {
    const file = this.bucketInstance.file(objectKey);
    const [metadata] = await file.getMetadata();
    return metadata;
  }
}
