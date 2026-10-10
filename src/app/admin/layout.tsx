import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · FL Tase3 Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
