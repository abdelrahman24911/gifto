"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { friendlyAuthError, type AuthState } from "@/app/(store)/login/actions";

export async function registerAccount(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) return { error: "Please enter your full name." };
  if (!/^[0-9+\s\-]{8,20}$/.test(phone))
    return { error: "Please enter a valid phone number." };
  if (!/.+@.+\..+/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });

  if (error) return { error: await friendlyAuthError(error.message) };

  // Confirmation emails disabled locally → a session comes back immediately,
  // and we can link the customer row right away.
  if (data.session) {
    await supabase.rpc("upsert_my_customer", {
      p_full_name: fullName,
      p_phone: phone,
      p_email: email,
    });
    redirect("/account");
  }

  return {
    notice:
      "Account created. Check your email for a confirmation link, then sign in.",
  };
}