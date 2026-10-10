"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { adminLogin, type AdminAuthState } from "@/app/admin/login/actions";

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AdminAuthState, FormData>(
    adminLogin,
    null,
  );

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-pill bg-primary-soft text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Staff sign in</h1>
          <p className="text-sm text-muted-foreground">FL Tase3 admin console</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Email" htmlFor="email" required>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@fltase3.com"
              className="pl-10"
              required
              autoFocus
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-10"
              required
            />
          </div>
        </Field>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="mt-4 rounded-md bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="mt-6 w-full" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
