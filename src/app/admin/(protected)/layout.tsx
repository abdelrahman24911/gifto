export const instant = false;

import { requireStaff } from "@/lib/data/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <AdminShell
      profile={{
        full_name: session.profile.full_name,
        email: session.profile.email,
        role: session.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
