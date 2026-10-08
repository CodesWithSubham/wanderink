import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
let R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
let R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
let R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
let R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

function validateR2Config() {
  if (!R2_ACCOUNT_ID) R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  if (!R2_ACCESS_KEY_ID) R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  if (!R2_SECRET_ACCESS_KEY) R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  if (!R2_BUCKET_NAME) R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
  if (!R2_PUBLIC_URL) R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error('Missing R2 environment variables');
  }
}

let r2Client: S3Client | null = null;

function getR2Client() {
  validateR2Config();
  
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  
  return r2Client;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  getUrl: string;
}

export function generateKey(userId: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${userId}/${timestamp}-${random}.${ext}`;
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900 // 15 minutes
): Promise<PresignedUploadResult> {
  validateR2Config();
  const client = getR2Client();
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;
  const getUrl = await createPresignedGetUrl(key, 3600); // 1 hour for private access

  return { uploadUrl, key, publicUrl, getUrl };
}

export async function createPresignedGetUrl(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  validateR2Config();
  const client = getR2Client();
  
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function createPresignedGetUrlLong(key: string): Promise<string> {
  // 24 hours for AI processing
  return createPresignedGetUrl(key, 86400);
}

export async function deleteObject(key: string): Promise<void> {
  validateR2Config();
  const client = getR2Client();
  
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
  });
  await client.send(command);
}

export async function objectExists(key: string): Promise<boolean> {
  validateR2Config();
  const client = getR2Client();
  
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

// Export getR2Client for direct access if needed
export { getR2Client };