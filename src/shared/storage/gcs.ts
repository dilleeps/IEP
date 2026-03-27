// src/shared/storage/gcs.ts
//
// Google Cloud Storage helper
// Config is resolved via appenv (not process.env)

import { Storage } from "@google-cloud/storage";
import { Readable } from "node:stream";
import * as path from "node:path";
import { createReadStream } from "node:fs";

import { appenv } from "../../config/appenv.js";
import { logger } from "../../config/logger.js";

export type SignedUrlAction = "read" | "write";

export interface GcsConfig {
  bucket: string;
  projectId?: string;
}

export class GCS {
  readonly bucketName: string;
  private readonly storage: Storage;

  constructor(cfg: GcsConfig) {
    this.bucketName = cfg.bucket;

    logger.info("GCS Storage constructor - received config", {
      bucket: cfg.bucket,
      projectId: cfg.projectId
    });

    this.storage = new Storage({
      projectId: cfg.projectId
    });

    logger.info("GCS initialized", {
      bucket: cfg.bucket,
      projectId: cfg.projectId
    });
  }

  /**
   * Preferred factory: load config via appenv
   */
  static fromAppEnv(): GCS {
    const bucket = appenv.get("GCS_BUCKET");
    logger.info("GCS config - checking bucket", { bucket, hasValue: !!bucket });
    
    if (!bucket) {
      throw new Error("GCS_BUCKET is required");
    }

    const projectId = appenv.get("GCP_PROJECT_ID");
    logger.info("GCS config - checking project ID", { projectId, hasValue: !!projectId });





    return new GCS({
      bucket,
      projectId
    });
  }

  // -------------------- helpers --------------------

  static joinPath(prefix: string, name: string): string {
    const p = (prefix ?? "").replace(/^\/+|\/+$/g, "");
    const n = (name ?? "").replace(/^\/+/g, "");
    return p ? `${p}/${n}` : n;
  }

  private bucket() {
    return this.storage.bucket(this.bucketName);
  }

  // -------------------- uploads --------------------

  async uploadFile(prefix: string, localPath: string, contentType?: string): Promise<string> {
    const base = path.basename(localPath);
    const objectKey = GCS.joinPath(prefix, base);

    await this.bucket().upload(localPath, {
      destination: objectKey,
      resumable: true,
      ...(contentType ? { contentType } : {}),
    });

    return objectKey;
  }

  async uploadReader(
    prefix: string,
    objectName: string,
    reader: Readable,
    opts?: { contentType?: string; cacheControl?: string }
  ): Promise<string> {
    const objectKey = GCS.joinPath(prefix, objectName);
    const file = this.bucket().file(objectKey);

    await new Promise<void>((resolve, reject) => {
      const ws = file.createWriteStream({
        resumable: true,
        metadata: {
          ...(opts?.contentType ? { contentType: opts.contentType } : {}),
          ...(opts?.cacheControl ? { cacheControl: opts.cacheControl } : {}),
        },
      });

      reader
        .on("error", reject)
        .pipe(ws)
        .on("error", reject)
        .on("finish", resolve);
    });

    return objectKey;
  }

  async uploadBytes(
    prefix: string,
    objectName: string,
    bytes: Buffer,
    contentType?: string
  ): Promise<string> {
    const objectKey = GCS.joinPath(prefix, objectName);
    const file = this.bucket().file(objectKey);

    await file.save(bytes, {
      resumable: false,
      metadata: contentType ? { contentType } : undefined,
    });

    return objectKey;
  }

  // -------------------- signed URLs --------------------

  async presignUrl(params: {
    objectKey: string;
    action: SignedUrlAction;
    expiresInSeconds: number;
  }): Promise<string> {
    const file = this.bucket().file(params.objectKey);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: params.action,
      expires: Date.now() + params.expiresInSeconds * 1000,
    });

    return url;
  }

  /**
   * Get file metadata
   */
  async getMetadata(objectKey: string): Promise<any> {
    const file = this.bucket().file(objectKey);
    const [metadata] = await file.getMetadata();
    return metadata;
  }

  /**
   * Create a readable stream for downloading
   */
  createReadStream(objectKey: string): Readable {
    return this.bucket().file(objectKey).createReadStream();
  }

  async presignGetURL(objectKey: string, expiresInSeconds: number): Promise<string> {
    return this.presignUrl({ objectKey, action: "read", expiresInSeconds });
  }

  async presignPutURL(objectKey: string, expiresInSeconds: number): Promise<string> {
    return this.presignUrl({ objectKey, action: "write", expiresInSeconds });
  }

  // -------------------- misc --------------------

  async exists(objectKey: string): Promise<boolean> {
    const [ok] = await this.bucket().file(objectKey).exists();
    return ok;
  }

  async delete(objectKey: string): Promise<void> {
    await this.bucket().file(objectKey).delete({ ignoreNotFound: true });
  }

  async uploadFileStream(prefix: string, localPath: string, contentType?: string): Promise<string> {
    const base = path.basename(localPath);
    return this.uploadReader(prefix, base, createReadStream(localPath), { contentType });
  }

  // -------------------- convenience methods (LLD) --------------------

  /**
   * Upload buffer as stream (convenience method)
   */
  async uploadStream(
    objectKey: string,
    buffer: Buffer,
    options?: { contentType?: string; metadata?: Record<string, string> }
  ): Promise<string> {
    const file = this.bucket().file(objectKey);

    await file.save(buffer, {
      resumable: false,
      metadata: {
        ...(options?.contentType ? { contentType: options.contentType } : {}),
        ...(options?.metadata || {}),
      },
    });

    return objectKey;
  }

  /**
   * Download file as buffer (convenience method)
   */
  async download(objectKey: string): Promise<Buffer> {
    const file = this.bucket().file(objectKey);
    const [buffer] = await file.download();
    return buffer;
  }

  /**
   * Get download URL (convenience method)
   */
  async getDownloadUrl(objectKey: string, expiresInSeconds: number = 900): Promise<string> {
    return this.presignGetURL(objectKey, expiresInSeconds);
  }
}
