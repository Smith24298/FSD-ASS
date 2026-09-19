import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AppError } from "../../shared/errors/app-error";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

export const ALLOWED_ATTACHMENT_MIME_TYPES: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.ms-excel": ["xls"],
  "text/csv": ["csv"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/zip": ["zip"],
};

export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

export interface StoredFile {
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface SaveFileInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export function saveFile(data: SaveFileInput): StoredFile {
  const ext = path.extname(data.filename).toLowerCase().replace(/^\./, "");
  const allowedExts = ALLOWED_ATTACHMENT_MIME_TYPES[data.mimeType] ?? [];

  if (!ext || !allowedExts.includes(ext)) {
    throw AppError.badRequest("File type is not allowed", "INVALID_FILE_TYPE");
  }

  if (data.buffer.byteLength > MAX_ATTACHMENT_SIZE) {
    throw AppError.badRequest(
      `File exceeds the maximum allowed size of ${Math.floor(MAX_ATTACHMENT_SIZE / 1024 / 1024)}MB`,
      "FILE_TOO_LARGE"
    );
  }

  const storageKey = `rfq-attachments/${randomUUID()}.${ext}`;
  const absolutePath = path.join(uploadsRoot, storageKey);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, data.buffer);

  return {
    storageKey,
    filename: data.filename,
    mimeType: data.mimeType,
    size: data.buffer.byteLength,
  };
}

export function getFilePath(storageKey: string): string {
  const absolutePath = path.resolve(uploadsRoot, storageKey);
  const relative = path.relative(uploadsRoot, absolutePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw AppError.badRequest("Invalid storage key", "INVALID_STORAGE_KEY");
  }
  if (!fs.existsSync(absolutePath)) {
    throw AppError.notFound("File not found", "FILE_NOT_FOUND");
  }
  return absolutePath;
}

export function deleteFile(storageKey: string): void {
  try {
    fs.rmSync(getFilePath(storageKey), { force: true });
  } catch {
    // best-effort cleanup; the DB record must still be removed
  }
}