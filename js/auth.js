import { supabase } from "./supabase.js";

export function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

export function validUsername(value) {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

export async function requireSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    location.href = "login.html";
    return null;
  }
  return data.session;
}

export async function getMyProfile() {
  const session = await requireSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  location.href = "index.html";
}
