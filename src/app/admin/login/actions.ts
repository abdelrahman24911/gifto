"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthState = { error?: string } | null;

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "Wrong email or password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "This account has not been confirmed yet.";
  }
  if (/too many requests/i.test(message)) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return message;
}

export async function adminLogin(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    await supabase.auth.signOut();
    return { error: "This account does not have staff access." };
  }

  const destination = next.startsWith("/admin") ? next : "/admin/dashboard";
  redirect(destination);
}

export async function adminSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
