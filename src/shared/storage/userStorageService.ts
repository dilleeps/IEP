// src/shared/storage/userStorageService.ts

import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { GCS } from './gcs.js';

type StorageBackend = 'gcs' | 'local';

interface UserStorageServiceOptions {
  gcs?: GCS;
  localRoot?: string;
}

interface StorageMetadata {
  contentType?: string;
  size?: number;
}

export class UserStorageService {
  private readonly gcs: GCS | null;
  private readonly localRoot: string | null;
  private readonly backend: StorageBackend;

  constructor(options: UserStorageServiceOptions) {
    if (options.gcs) {
      this.gcs = options.gcs;
      this.localRoot = null;
      this.backend = 'gcs';
      return;
    }

    if (options.localRoot) {
      this.gcs = null;
      this.localRoot = path.resolve(options.localRoot);
      this.backend = 'local';
      return;
    }

    throw new Error('UserStorageService requires either gcs or localRoot');
  }

  async uploadPDF(userId: string, r: Readable): Promise<string> {
    return this.upload(userId, 'pdf', r, 'application/pdf');
  }

  async uploadDOCX(userId: string, r: Readable): Promise<string> {
    return this.upload(
      userId,
      'docx',
      r,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  }

  async uploadPDFBytes(userId: string, b: Buffer): Promise<string> {
    return this.uploadBytes(userId, 'pdf', b, 'application/pdf');
  }

  async uploadDOCXBytes(userId: string, b: Buffer): Promise<string> {
    return this.uploadBytes(
      userId,
      'docx',
      b,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  }

  async downloadURL(objectKey: string, expiresInSeconds: number): Promise<string> {
    if (this.backend === 'gcs') {
      return this.gcs!.presignGetURL(objectKey, expiresInSeconds);
    }

    return `/api/v1/storage/download?key=${encodeURIComponent(objectKey)}`;
  }

  async downloadData(objectKey: string): Promise<Buffer> {
    if (this.backend === 'gcs') {
      return this.gcs!.download(objectKey);
    }

    return readFile(this.localPath(objectKey));
  }

  async exists(objectKey: string): Promise<boolean> {
    if (this.backend === 'gcs') {
      return this.gcs!.exists(objectKey);
    }

    try {
      await stat(this.localPath(objectKey));
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(objectKey: string): Promise<StorageMetadata> {
    if (this.backend === 'gcs') {
      const metadata = await this.gcs!.getMetadata(objectKey);
      return {
        contentType: metadata.contentType,
        size: Number(metadata.size || 0),
      };
    }

    const fileStat = await stat(this.localPath(objectKey));
    return {
      contentType: guessContentType(objectKey),
      size: fileStat.size,
    };
  }

  createReadStream(objectKey: string): Readable {
    if (this.backend === 'gcs') {
      return this.gcs!.createReadStream(objectKey);
    }

    return createReadStream(this.localPath(objectKey));
  }

  // -------------------- internals --------------------

  private async upload(userId: string, ext: string, r: Readable, mime: string): Promise<string> {
    const objectKey = this.resumeKey(userId, ext);

    if (this.backend === 'gcs') {
      const prefix = path.posix.dirname(objectKey);
      const name = path.posix.basename(objectKey);
      await this.gcs!.uploadReader(prefix, name, r, { contentType: mime });
      return objectKey;
    }

    await this.saveLocal(objectKey, r);
    return objectKey;
  }

  private async uploadBytes(userId: string, ext: string, b: Buffer, mime: string): Promise<string> {
    const objectKey = this.resumeKey(userId, ext);

    if (this.backend === 'gcs') {
      const prefix = path.posix.dirname(objectKey);
      const name = path.posix.basename(objectKey);
      await this.gcs!.uploadBytes(prefix, name, b, mime);
      return objectKey;
    }

    await this.saveLocal(objectKey, b);
    return objectKey;
  }

  private async saveLocal(objectKey: string, content: Readable | Buffer): Promise<void> {
    const filePath = this.localPath(objectKey);
    await mkdir(path.dirname(filePath), { recursive: true });

    const bytes = Buffer.isBuffer(content) ? content : await readableToBuffer(content);
    await writeFile(filePath, bytes);
  }

  private localPath(objectKey: string): string {
    if (!this.localRoot) {
      throw new Error('localRoot not configured');
    }

    const normalizedKey = objectKey.replace(/^\/+/, '');
    const root = path.resolve(this.localRoot);
    const resolvedPath = path.resolve(root, normalizedKey);

    if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
      throw new Error(`invalid storage object key: ${objectKey}`);
    }

    return resolvedPath;
  }

  private resumeKey(userId: string, ext: string): string {
    const id = cryptoRandomUUID();
    return path.posix.join('users', safeSeg(userId), 'resumes', `${id}.${ext}`);
  }
}

function safeSeg(s: string): string {
  return s.replace(/[\/\\]/g, '_');
}

function cryptoRandomUUID(): string {
  return randomUUID();
}

async function readableToBuffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function guessContentType(objectKey: string): string {
  const ext = path.extname(objectKey).toLowerCase();
  if (ext === '.pdf') {
    return 'application/pdf';
  }
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (ext === '.txt') {
    return 'text/plain';
  }
  return 'application/octet-stream';
}
