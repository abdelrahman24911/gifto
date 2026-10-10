import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Quick, secure checkout on FL Tase3. Cash on delivery or pay by card. Free delivery over 1500 EGP.",
};

export default function CheckoutPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Secure checkout"
        title="Almost there"
        description="Tell us who the gift is for and where it should land. We'll take care of the rest."
      />
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </Section>
  );
}