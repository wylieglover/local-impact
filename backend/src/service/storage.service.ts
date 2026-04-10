import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.middleware.js";
import crypto from "crypto";

const supabase = createClient(env.SUPABASE_BUCKET_URL, env.SUPABASE_BUCKET_SECRET_KEY);

export const uploadIssuePhoto = async (
  file: Express.Multer.File,
  userId: string
): Promise<string> => {
  // Generate a unique filename — never trust the original filename
  const ext = file.mimetype.split("/")[1];
  const filename = `${userId}/${crypto.randomUUID()}.${ext}`;

  console.log("Attempting upload to bucket:", env.SUPABASE_BUCKET_NAME);

  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET_NAME)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error("SUPABASE ERROR DETAIL:", JSON.stringify(error, null, 2));
    throw new AppError(500, "UPLOAD_FAILED", "Failed to upload photo");
  }

  const { data } = supabase.storage.from(env.SUPABASE_BUCKET_NAME).getPublicUrl(filename);

  return data.publicUrl;
};

export const uploadAvatarPhoto = async (
  file: Express.Multer.File,
  userId: string
): Promise<string> => {
  const ext = file.mimetype.split("/")[1]
  // Fixed filename per user — upsert replaces the old one automatically
  const filename = `avatars/${userId}.${ext}`

  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET_NAME)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    })

  if (error) {
    throw new AppError(500, "UPLOAD_FAILED", "Failed to upload avatar")
  }

  const { data } = supabase.storage
    .from(env.SUPABASE_BUCKET_NAME)
    .getPublicUrl(filename)

  return data.publicUrl
}

export const deleteIssuePhoto = async (photoUrl: string): Promise<void> => {
  // Extract the path from the full URL
  const path = photoUrl.split(`${env.SUPABASE_BUCKET_NAME}/`)[1];
  if (!path) return;

  await supabase.storage.from(env.SUPABASE_BUCKET_NAME).remove([path]);
};