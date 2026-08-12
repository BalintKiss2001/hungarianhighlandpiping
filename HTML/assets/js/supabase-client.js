import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.HHP_SUPABASE || {};
const supabaseUrl = (config.url || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

export const isSupabaseConfigured = Boolean(supabaseUrl && config.anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, config.anonKey)
  : null;

export function showConfigMessage(element) {
  if (!element || isSupabaseConfigured) {
    return;
  }

  element.textContent = "A bejelentkezéshez először add meg a Supabase URL-t és anon kulcsot az assets/js/supabase-config.js fájlban.";
  element.className = "alert alert-warning";
}
