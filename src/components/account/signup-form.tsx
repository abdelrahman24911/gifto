"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { AuthState } from "@/app/(store)/login/actions";
import { registerAccount } from "@/app/(store)/signup/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    registerAccount,
    null,
  );

  return (
    <form action={formAction} noValidate className="rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
      <div className="space-y-4">
        <Field label="Full name" htmlFor="full_name" required>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="full_name" name="full_name" autoComplete="name" placeholder="Your name" className="pl-10" required />
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" required>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" className="pl-10" required />
            </div>
          </Field>
          <Field label="Email" htmlFor="email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-10" required />
            </div>
          </Field>
        </div>
        <Field label="Password" htmlFor="password" required hint="At least 6 characters.">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" className="pl-10" required minLength={6} />
          </div>
        </Field>
      </div>

      {state?.error ? (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.notice ? (
        <p role="status" className="mt-4 rounded-md bg-accent-soft px-3 py-2.5 text-xs font-medium text-accent-foreground">
          {state.notice}
        </p>
      ) : null}

      <Button type="submit" className="mt-5 w-full" size="lg" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}