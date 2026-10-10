import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { TrackOrderView } from "@/components/shop/track-order-view";

export const instant = false;

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Follow your FL Tase3 gift from our workshop to your loved one's doorstep — with your order number and phone.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; phone?: string }>;
}) {
  const { order, phone } = await searchParams;

  return (
    <Section className="min-h-[60vh]">
      <SectionHeading
        eyebrow="Track order"
        title="Where is my gift?"
        description="Enter the order number and the phone you used at checkout to see live progress."
        align="center"
      />
      <div className="mt-10">
        <TrackOrderView defaultOrder={order ?? ""} defaultPhone={phone ?? ""} />
      </div>
    </Section>
  );
}