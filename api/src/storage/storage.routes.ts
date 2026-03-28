// src/modules/storage/storage.routes.ts
//
// Storage proxy routes for secure file downloads via ADC

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getStorageService } from "../shared/services.js";
import { logger } from "../config/logger.js";
import type { AuthRequest } from "../middleware/authenticate.js";

const router = Router();

/**
 * Download file via proxy (for ADC-authenticated GCS access)
 * GET /api/v1/storage/download?key=users/abc/file.pdf
 */
router.get("/download", authenticate, async (req: AuthRequest, res) => {
  try {
    const objectKey = req.query.key as string;
    
    if (!objectKey) {
      return res.status(400).json({ error: "Missing 'key' parameter" });
    }

    // Extract userId from objectKey (format: users/{userId}/...)
    const pathParts = objectKey.split("/");
    if (pathParts[0] !== "users" || !pathParts[1]) {
      return res.status(400).json({ error: "Invalid object key format" });
    }

    const fileOwnerId = pathParts[1];
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    // Authorization: users can access only their own files; ADMIN can access any file.
    if (!currentUserId || (fileOwnerId !== currentUserId && userRole !== 'ADMIN')) {
      logger.warn("Unauthorized file access attempt", { 
        fileOwnerId, 
        currentUserId, 
        userRole, 
        objectKey 
      });
      return res.status(403).json({ error: "Unauthorized: You can only access your own files" });
    }

    const storageService = getStorageService();

    // Verify file exists
    const exists = await storageService.exists(objectKey);
    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get metadata for content type
    const metadata = await storageService.getMetadata(objectKey);
    const contentType = metadata.contentType || "application/octet-stream";

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${objectKey.split("/").pop()}"`);
    
    if (metadata.size) {
      res.setHeader("Content-Length", metadata.size);
    }

    // Best-effort audit entry for file read access.
    import('../audit/audit.service.js')
      .then(({ AuditLogService }) =>
        AuditLogService.log({
          userId: currentUserId,
          action: 'data_accessed',
          entityType: 'document_file',
          entityId: fileOwnerId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string | undefined,
          requestMethod: req.method,
          requestPath: req.originalUrl,
          piiAccessed: true,
          piiFields: ['file'],
          status: 'success',
          metadata: { objectKey },
        })
      )
      .catch((err) => logger.warn('Storage audit log failed', { err: err?.message }));

    // Stream the file
    const stream = storageService.createReadStream(objectKey);
    
    stream.on("error", (error) => {
      logger.error("Stream error", { objectKey, error: error.message });
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file" });
      }
    });

    stream.pipe(res);
  } catch (error: any) {
    logger.error("Download failed", { error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: "Download failed" });
    }
  }
});

export default router;
