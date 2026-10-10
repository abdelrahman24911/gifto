"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { AuthState } from "@/app/(store)/login/actions";
import { loginWithPassword } from "@/app/(store)/login/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginWithPassword,
    null,
  );

  return (
    <form action={formAction} noValidate className="rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
      <div className="space-y-4">
        <Field label="Email" htmlFor="email" required>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-10" required autoFocus />
          </div>
        </Field>
        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" className="pl-10" required />
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
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-bold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}