export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gift } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { getProfile, getSession } from "@/lib/data/auth";
import { AdminLoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const user = await getSession();
  if (user) {
    const profile = await getProfile();
    if (profile && (profile.role === "admin" || profile.role === "staff")) {
      redirect("/admin/dashboard");
    }
  }

  return (
    <div className="container-page flex min-h-dvh flex-col items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-pill bg-primary text-primary-foreground">
            <Gift className="size-7" aria-hidden />
          </span>
          <p className="mt-4 eyebrow text-primary">{BRAND.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{BRAND.tagline}</p>
        </div>

        <AdminLoginForm next={next} />

        <p className="mt-6 text-center text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
