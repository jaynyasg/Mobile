import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://oykwxnzlpxbrfcoejawt.supabase.co";
export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a3d4bnpscHhicmZjb2VqYXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjU3MzgsImV4cCI6MjA5MjA0MTczOH0.R3M52V7L0ukORz34aLLKWWLf9r6A9B7j01gnJDxB3b4";

const authStorage = {
  getItem: (key: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.setItem(key, value)) : AsyncStorage.setItem(key, value)),
  removeItem: (key: string) => (Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.removeItem(key)) : AsyncStorage.removeItem(key)),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export function communityPreviewEnabled(): boolean {
  return process.env.EXPO_PUBLIC_COMMUNITY_PREVIEW === "1";
}
