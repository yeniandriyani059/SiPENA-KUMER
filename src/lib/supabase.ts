import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://nqdopaupzxibaozlolpl.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZG9wYXVwenhpYmFvemxvbHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMzYwNTIsImV4cCI6MjEwNDkxMjA1Mn0.aoe7q8bmkQdaGhXOv1nJj7tssC3_05U5apV0O2Stn-Y";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined
  }
});

export const isSupabaseConfigured = true;

/**
 * Format pesan error umum dari Supabase Auth ke Bahasa Indonesia
 */
export function formatAuthErrorMessage(error: any): string {
  if (!error) return "Terjadi kesalahan.";

  const rawMsg =
    typeof error === "string" ? error : error.message || error.error_description || String(error);
  const lower = rawMsg.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
    return "Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.";
  }
  if (lower.includes("user already registered") || lower.includes("user_already_exists")) {
    return "Alamat email ini sudah terdaftar. Silakan gunakan menu Masuk Aplikasi.";
  }
  if (
    lower.includes("password should be at least") ||
    lower.includes("weak_password") ||
    lower.includes("at least 6 characters")
  ) {
    return "Kata sandi minimal harus terdiri dari 6 karakter.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat lagi.";
  }

  return rawMsg;
}

export type { User, Session };
export default supabase;
