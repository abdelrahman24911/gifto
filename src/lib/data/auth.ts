import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/** Deduplicated per request so a layout + page share one session lookup. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSession();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
});

export interface StaffSession {
  user: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  profile: Profile;
  role: UserRole;
}

/**
 * Server-side gate for /admin. The real enforcement is RLS — this only keeps
 * unauthenticated users out of the admin shell early.
 */
export async function requireStaff(): Promise<StaffSession> {
  const user = await getSession();
  if (!user) redirect("/admin/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return { user, profile, role: profile.role };
}

export async function requireAdmin(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "admin") redirect("/admin");
  return session;
}

export async function getCurrentProfile(
  supabase: SupabaseServerClient,
): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
