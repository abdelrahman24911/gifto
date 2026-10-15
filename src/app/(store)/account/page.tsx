export const instant = false;
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { AccountContent } from "@/components/account/account-content";
import { AccountSetup } from "@/components/account/account-setup";
import { getCustomerAccount } from "@/lib/data/account";
import { getSession } from "@/lib/data/auth";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your FL Tase3 profile, order history and saved gifts.",
};

export default async function AccountPage() {
  const account = await getCustomerAccount();

  if (!account) {
    const user = await getSession();
    // Middleware keeps signed-out visitors out; guard the edge case anyway.
    if (!user) notFound();

    const fullName =
      typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    const phone = typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "";

    return (
      <Section>
        <SectionHeading
          eyebrow="My account"
          title="Finish setting up your account"
          description="Add your details once and every order made with your email is tracked here."
        />
        <div className="mt-10">
          <AccountSetup fullName={fullName} phone={phone} email={user.email ?? ""} />
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <SectionHeading
        eyebrow="My account"
        title={`Hey, ${account.customer.full_name ?? "there"}`}
        description="Manage your details and follow every gift order in one place."
      />
      <div className="mt-10">
        <AccountContent customer={account.customer} orders={account.orders} />
      </div>
    </Section>
  );
}