import { supabase } from './supabase';

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * 
 * @param bucket - The name of the storage bucket
 * @param path - The path/filename inside the bucket
 * @param file - The File or Blob to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadImageToSupabase(bucket: string, path: string, file: File | Blob): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading image to Supabase:', error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
