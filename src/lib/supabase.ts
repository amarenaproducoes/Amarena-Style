/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Fallback to the keys provided by the user if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ynekidtchpalpyvurfvv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pmH03B-tIIRPfKAWPYSUQg_7AQYlvrW';

// Ensure the URL is clean (removing /rest/v1/ if present)
const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(cleanUrl, supabaseAnonKey);
