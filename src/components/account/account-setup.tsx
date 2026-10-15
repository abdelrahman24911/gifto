"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updateProfile, type ProfileState } from "@/app/(store)/account/actions";

/**
 * Shown when a signed-in user has no linked customer row yet (for example an
 * account created outside the signup flow). Saving creates the row via
 * `upsert_my_customer`, after which the full account page renders.
 */
export function AccountSetup({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, formAction, pending] = React.useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  );

  return (
    <section className="max-w-xl rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-semibold text-foreground">{email}</span>. Add your
        details to start tracking orders made with this email.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <Field label="Full name" htmlFor="setup_name" required>
          <Input
            id="setup_name"
            name="full_name"
            defaultValue={fullName}
            autoComplete="name"
            disabled={pending}
            required
          />
        </Field>
        <Field label="Phone" htmlFor="setup_phone" required hint="Used for delivery calls.">
          <Input
            id="setup_phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={phone}
            autoComplete="tel"
            disabled={pending}
            required
          />
        </Field>
        {state?.error ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
          >
            {state.error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          <Save className="size-4" aria-hidden />
          {pending ? "Saving…" : "Create my profile"}
        </Button>
      </form>
    </section>
  );
}
