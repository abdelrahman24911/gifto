import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Heart, PackageCheck, Sparkles, Timer } from "lucide-react";
import { BRAND, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatEGP } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Our story",
  description: `${BRAND.name} is an Egyptian gift studio — curated boxes, handwritten notes and same-week delivery across Egypt.`,
};

const values = [
  {
    icon: PackageCheck,
    title: "Wrapped by hand",
    text: "Every order is packed the day it is placed: kraft paper, ribbon and a handwritten card. Nothing leaves the studio looking careless.",
  },
  {
    icon: Timer,
    title: "Fast, tracked delivery",
    text: "Same-day across Cairo and Giza, 1–3 days nationwide. You and the person receiving the gift both get tracking.",
  },
  {
    icon: Sparkles,
    title: "Personal, not generic",
    text: "Add a name, a message, an inside joke. We print it exactly as you type it — no templates, no filler.",
  },
  {
    icon: Heart,
    title: "Made for real moments",
    text: "Birthdays, graduations, apologies and no-reason-at-all surprises. The catalogue is edited, never endless.",
  },
];

const milestones = [
  { label: "Orders gifts wrapped", value: "1,200+" },
  { label: "Governorates delivered to", value: "27" },
  { label: "Average rating", value: "4.9/5" },
  { label: "Free delivery over", value: formatEGP(FREE_DELIVERY_THRESHOLD) },
];

export default function AboutPage() {
  return (
    <>
      <Section tone="ink" className="py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-accent">Our story</p>
          <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-black leading-[1.05] tracking-tight text-white">
            Gifting should feel like the easy part.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            {BRAND.name} started with a simple frustration: picking the perfect gift is the fun
            bit, and everything after it — wrapping, delivery, timing — is the stressful bit. So we
            took the stressful bit off your hands.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-pill bg-primary px-6 text-sm font-bold text-white shadow-card transition-colors hover:bg-primary-hover"
            >
              Browse gifts
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/gift-finder"
              className="inline-flex h-12 items-center gap-2 rounded-pill border border-white/25 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Find a gift in 3 questions
            </Link>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="max-w-xl space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              We are a small studio, not a warehouse. Each box is assembled by hand, checked
              against your note, and photographed before it ships so there are no surprises.
            </p>
            <p>
              We keep the catalogue deliberately short. If something is on the shelf, it is because
              we would happily give it ourselves — no padding to make a page look busy.
            </p>
            <p>
              Delivery runs across all of Egypt, with cash on delivery available everywhere and
              same-day in Cairo and Giza when you order before the cut-off. The person receiving
              the gift can follow it the whole way too.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {milestones.map((item) => (
              <div
                key={item.label}
                className="rounded-card border border-border bg-surface p-5 shadow-hairline"
              >
                <dd className="text-2xl font-black tracking-tight text-foreground">{item.value}</dd>
                <dt className="mt-1 text-[13px] leading-snug text-muted-foreground">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="What you can count on"
          title="Four promises we do not break"
          description="These are the parts of gifting we refuse to cut corners on."
        />
        <ul className="grid gap-5 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="rounded-card border border-border bg-surface p-6 shadow-hairline"
            >
              <span className="grid size-11 place-items-center rounded-pill bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <section className="border-t border-border bg-primary-soft">
        <div className="container-page flex flex-col items-center gap-5 py-14 text-center">
          <p className="eyebrow text-primary">Say hello</p>
          <h2 className="max-w-2xl text-title font-extrabold tracking-tight text-foreground">
            Questions, bulk orders, or a gift that needs a human touch?
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Message us on WhatsApp and a person — not a bot — will help you sort it out.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={BRAND.whatsapp}
              className="inline-flex h-12 items-center gap-2 rounded-pill bg-primary px-6 text-sm font-bold text-white shadow-card transition-colors hover:bg-primary-hover"
            >
              Chat on WhatsApp
            </a>
            <a
              href={`mailto:${BRAND.email}`}
              className="inline-flex h-12 items-center gap-2 rounded-pill border border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {BRAND.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
