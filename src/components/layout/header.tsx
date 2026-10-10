"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useShop } from "@/components/shop/shop-provider";
import { Dialog } from "@/components/ui/dialog";
import { AnnouncementBar, BrandMark } from "@/components/layout/brand";

export interface NavLink {
  href: string;
  label: string;
}

const primaryLinks: NavLink[] = [
  { href: "/shop", label: "Shop" },
  { href: "/gift-finder", label: "Gift finder" },
  { href: "/track", label: "Track order" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ categories }: { categories: { name: string; slug: string }[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, wishlist, hydrated } = useShop();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    closeMenu();
  };

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-3 md:h-20 md:gap-6">
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-pill text-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Link href="/" className="shrink-0" aria-label={`${BRAND.name} home`}>
            <BrandMark />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {primaryLinks.map((link) => {
                const active =
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "rounded-pill px-3.5 py-2 text-sm font-semibold transition-colors",
                        active
                          ? "bg-primary-soft text-primary"
                          : "text-foreground hover:bg-muted hover:text-primary",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <form
            role="search"
            onSubmit={submitSearch}
            className="relative ml-auto hidden max-w-xs flex-1 md:block"
          >
            <label htmlFor="site-search" className="sr-only">
              Search gifts
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search gifts…"
              className="h-10 w-full rounded-pill border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none"
            />
          </form>

          <div className="ml-auto flex items-center gap-0.5 md:ml-0 md:gap-1">
            <Link
              href="/account"
              className="hidden size-10 place-items-center rounded-pill text-foreground transition-colors hover:bg-muted hover:text-primary sm:grid"
              aria-label="Your account"
            >
              <User className="size-5" aria-hidden />
            </Link>

            <Link
              href="/wishlist"
              className="relative grid size-10 place-items-center rounded-pill text-foreground transition-colors hover:bg-muted hover:text-primary"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <Heart className="size-5" aria-hidden />
              {hydrated && wishlist.length > 0 ? (
                <BadgeCount>{wishlist.length}</BadgeCount>
              ) : null}
            </Link>

            <Link
              href="/cart"
              className="relative grid size-10 place-items-center rounded-pill text-foreground transition-colors hover:bg-muted hover:text-primary"
              aria-label={`Cart, ${hydrated ? count : 0} items`}
            >
              <ShoppingBag className="size-5" aria-hidden />
              {hydrated && count > 0 ? <BadgeCount>{count}</BadgeCount> : null}
            </Link>
          </div>
        </div>

        <div className="container-page pb-3 md:hidden">
          <form role="search" onSubmit={submitSearch} className="relative">
            <label htmlFor="site-search-mobile" className="sr-only">
              Search gifts
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="site-search-mobile"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search gifts…"
              className="h-10 w-full rounded-pill border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
            />
          </form>
        </div>
      </div>

      <Dialog
        open={menuOpen}
        onClose={closeMenu}
        title="Menu"
        size="sm"
        className="sm:max-w-sm"
      >
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-md px-3 py-3 text-base font-semibold transition-colors hover:bg-muted"
                >
                  {link.label}
                  <span aria-hidden className="text-muted-foreground">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-6 px-3 text-muted-foreground">Categories</p>
          <ul className="mt-2 space-y-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  onClick={closeMenu}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <Link
              href="/account"
              onClick={closeMenu}
              className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Account
            </Link>
            <Link
              href="/wishlist"
              onClick={closeMenu}
              className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Wishlist ({wishlist.length})
            </Link>
          </div>
        </nav>
      </Dialog>
    </header>
  );
}

function BadgeCount({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid min-w-4.5 place-items-center rounded-pill bg-primary px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background">
      {children}
    </span>
  );
}
