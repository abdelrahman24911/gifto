export const instant = false;
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { AccountContent } from "@/components/account/account-content";
import { getCustomerAccount } from "@/lib/data/account";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your FL Tase3 profile, order history and saved gifts.",
};

export default async function AccountPage() {
  const account = await getCustomerAccount();
  if (!account) notFound();

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