import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = {
  title: "Your Cart",
  description:
    "Review your FL Tase3 cart — personalized gifts, delivery in 1–3 days across Egypt, free delivery over 1500 EGP.",
};

export default function CartPage() {
  return (
    <Section className="min-h-[60vh]">
      <SectionHeading
        eyebrow="FL Tase3"
        title="Your cart"
        description="Review your picks, adjust quantities, and head to checkout."
      />
      <div className="mt-10">
        <CartView />
      </div>
    </Section>
  );
}