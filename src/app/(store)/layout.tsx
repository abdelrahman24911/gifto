import { SiteHeader } from "@/components/layout/header";
import { StoreFooter } from "@/components/layout/footer";
import { ShopProvider } from "@/components/shop/shop-provider";
import { listCategories } from "@/lib/data/categories";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await listCategories();

  return (
    <ShopProvider>
      <div className="flex min-h-full flex-col">
        <SiteHeader categories={categories.map(({ name, slug }) => ({ name, slug }))} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <StoreFooter />
      </div>
    </ShopProvider>
  );
}
