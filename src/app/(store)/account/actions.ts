"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signOutAccount(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ProfileState = { error?: string; ok?: boolean } | null;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) return { error: "Please enter your full name." };
  if (!/^[0-9+\s\-]{8,20}$/.test(phone))
    return { error: "Please enter a valid phone number." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_my_customer", {
    p_full_name: fullName,
    p_phone: phone,
  });
  if (error) return { error: "We couldn't save your changes. Try again." };

  revalidatePath("/account");
  return { ok: true };
}