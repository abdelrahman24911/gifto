import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { BrandMark } from "@/components/layout/brand";

export function StoreFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {BRAND.tagline} Handpicked gifts, wrapped properly, delivered across Egypt.
          </p>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            { href: "/shop", label: "All gifts" },
            { href: "/shop?sort=best-selling", label: "Best sellers" },
            { href: "/gift-finder", label: "Gift finder" },
            { href: "/shop?budget=under-500", label: "Under 500 EGP" },
          ]}
        />

        <FooterColumn
          title="Help"
          links={[
            { href: "/track", label: "Track your order" },
            { href: "/faq", label: "FAQ" },
            { href: "/shipping", label: "Shipping & delivery" },
            { href: "/returns", label: "Returns" },
            { href: "/contact", label: "Contact us" },
          ]}
        />

        <div>
          <h3 className="eyebrow text-muted-foreground">Get in touch</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <a href={BRAND.whatsapp} className="transition-colors hover:text-primary">
                WhatsApp {BRAND.whatsappDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${BRAND.email}`} className="transition-colors hover:text-primary">
                {BRAND.email}
              </a>
            </li>
            <li>
              <a href={BRAND.instagram} className="transition-colors hover:text-primary">
                {BRAND.instagramHandle}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {BRAND.copyrightYear} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/admin/login" className="hover:text-primary">
              Staff login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="eyebrow text-muted-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="text-muted-foreground transition-colors hover:text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
