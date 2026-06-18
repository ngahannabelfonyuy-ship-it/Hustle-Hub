"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  AlertTriangle,
  BarChart, 
  CheckSquare,
  LayoutDashboard, 
  Landmark,
  LogOut, 
  Settings, 
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users & Verification", icon: Users },
  { href: "/admin/approvals", label: "Approvals Queue", icon: CheckSquare },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/escrow", label: "Escrow Monitor", icon: Landmark },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-(--color-surface-container-low)">
        <span className="inline-block w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-(--color-surface-container-low) overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold font-[family-name:--font-headline] text-white">
            HustleHub
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mt-1">Admin Panel</div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-(--radius-md) text-body-sm font-medium transition-colors",
                  isActive 
                    ? "bg-red-500 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-(--radius-md) text-body-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="font-bold">HustleHub</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 ml-2">Admin</span>
          </div>
          <button className="p-2">
            <LayoutDashboard className="w-5 h-5 text-gray-300" />
          </button>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
