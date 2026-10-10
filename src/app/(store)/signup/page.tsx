export const instant = false;
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { SignupForm } from "@/components/account/signup-form";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your FL Tase3 account to save gifts, view order history and check out faster.",
};

export default function SignupPage() {
  return (
    <Section className="min-h-[65vh]">
      <SectionHeading
        eyebrow="Join FL Tase3"
        title="Create your account"
        description="Save your details for faster checkout and keep every gift order in one place."
        align="center"
      />
      <div className="mx-auto mt-10 max-w-md">
        <SignupForm />
      </div>
    </Section>
  );
}