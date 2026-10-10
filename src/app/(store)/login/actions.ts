"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = { error?: string; notice?: string } | null;

export async function loginWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter both your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: await friendlyAuthError(error.message) };

  redirect("/account");
}

export async function friendlyAuthError(message: string): Promise<string> {
  if (/invalid login credentials/i.test(message)) {
    return "Wrong email or password. Check your details and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email address before signing in.";
  }
  if (/too many requests/i.test(message)) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return message;
}
