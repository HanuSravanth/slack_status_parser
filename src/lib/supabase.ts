import { createClient } from "@supabase/supabase-js";

// Retrieve keys from standard environment locations
// Supporting both Vercel/Vite client prefixes and straight Node.js variables
const envs = (import.meta as any).env || {};
const procEnvs = typeof process !== "undefined" ? process.env || {} : {};

const supabaseUrl = (
  envs.VITE_SUPABASE_URL || 
  envs.VITE_SUPABASE_PROJECT_URL ||
  envs.VITE_PROJECT_URL ||
  procEnvs.SUPABASE_URL ||
  procEnvs.SUPABASE_PROJECT_URL ||
  procEnvs.PROJECT_URL ||
  ""
).trim();

const supabaseAnonKey = (
  envs.VITE_SUPABASE_ANON_KEY || 
  envs.VITE_SUPABASE_PUBLISHABLE_KEY ||
  envs.VITE_PUBLISHABLE_KEY ||
  procEnvs.SUPABASE_ANON_KEY ||
  procEnvs.SUPABASE_PUBLISHABLE_KEY ||
  procEnvs.PUBLISHABLE_KEY ||
  ""
).trim();

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== "MY_SUPABASE_URL" && supabaseUrl !== "");

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export function checkSupabaseStatus() {
  return {
    isConfigured,
    supabaseUrl: isConfigured ? supabaseUrl : null,
    provider: "Supabase Database Client"
  };
}
