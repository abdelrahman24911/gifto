export const instant = false;
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to FL Tase3 to view your orders, saved gifts and address book.",
};

export default function LoginPage() {
  return (
    <Section className="min-h-[65vh]">
      <SectionHeading
        eyebrow="Welcome back"
        title="Sign in to your account"
        description="View your order history, saved gifts, and check out faster."
        align="center"
      />
      <div className="mx-auto mt-10 max-w-md">
        <LoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Guests can still order — an account is optional.
        </p>
      </div>
    </Section>
  );
}