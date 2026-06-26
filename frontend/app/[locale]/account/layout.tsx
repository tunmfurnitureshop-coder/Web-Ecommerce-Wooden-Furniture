import { CustomerAuthGuard } from "@/components/customer/CustomerAuthGuard";
import { AccountSidebar } from "@/design-system/layout/account-sidebar";
import { AccountMobileNav } from "@/design-system/layout/account-mobile-nav";
import { Container } from "@/design-system/primitives/container";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthGuard>
      <Container className="py-8 pb-16">
        <AccountMobileNav />
        <div className="flex gap-8 items-start">
          <aside className="hidden md:block w-48 shrink-0">
            <AccountSidebar />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </Container>
    </CustomerAuthGuard>
  );
}
