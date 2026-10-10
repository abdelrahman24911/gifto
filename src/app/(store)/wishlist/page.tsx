export const instant = false;
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/section";
import { WishlistView } from "@/components/shop/wishlist-view";

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "Your saved FL Tase3 gifts — kept here until you're ready to send them.",
};

export default function WishlistPage() {
  return (
    <Section className="min-h-[60vh]">
      <SectionHeading
        eyebrow="Saved for later"
        title="My wishlist"
        description="Gifts you hearted while browsing, waiting for the right moment."
      />
      <div className="mt-10">
        <WishlistView />
      </div>
    </Section>
  );
}