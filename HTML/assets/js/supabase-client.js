import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.HHP_SUPABASE || {};

export const isSupabaseConfigured = Boolean(config.url && config.anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(config.url, config.anonKey)
  : null;

export function showConfigMessage(element) {
  if (!element || isSupabaseConfigured) {
    return;
  }

  element.textContent = "A bejelentkezeshez eloszor add meg a Supabase URL-t es anon kulcsot az assets/js/supabase-config.js fajlban.";
  element.className = "alert alert-warning";
}
