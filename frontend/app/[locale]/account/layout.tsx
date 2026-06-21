import { CustomerAuthGuard } from "@/components/customer/CustomerAuthGuard";
import { CustomerAccountSidebar } from "@/components/customer/CustomerAccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthGuard>
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        <CustomerAccountSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </CustomerAuthGuard>
  );
}
