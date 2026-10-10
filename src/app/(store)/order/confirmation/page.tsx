import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { ConfirmationView } from "@/components/shop/confirmation-view";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description:
    "Your FL Tase3 order has been placed. Thanks for choosing thoughtful gifts.",
};

export default function ConfirmationPage() {
  return (
    <Section className="min-h-[60vh]">
      <SectionHeading
        eyebrow="Almost done"
        title="Order confirmation"
        align="center"
      />
      <div className="mt-10">
        <ConfirmationView />
      </div>
    </Section>
  );
}