"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search, Database, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useInternalLayoutOptional } from "@/components/InternalLayoutContext";
import { internalNavigation } from "@/components/InternalSidebar";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import BrandMark from "@/components/BrandMark";

type NavbarConfig = {
  title: string;
  icon: ReactNode;
  rightAction?: ReactNode;
};

export default function InternalNavbar() {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const layout = useInternalLayoutOptional();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setMenuOpen(false);
      // no router.push to avoid layout mismatch; rely on downstream guards
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error logging out");
    }
  };

  const getDisplayName = (u: SupabaseUser | null) => {
    if (!u) return "";
    const metaName =
      (u.user_metadata?.full_name as string | undefined) ||
      (u.user_metadata?.name as string | undefined) ||
      "";
    return metaName.trim() || u.email || "";
  };

  const getInitials = (display: string) => {
    if (!display) return "U";
    const parts = display.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const navConfig = useMemo<NavbarConfig>(() => {
    if (pathname?.startsWith("/results")) {
      return {
        title: "Saved lead sessions",
        icon: <Database className="h-4 w-4" />,
        rightAction: (
          <Link href="/sourcer" className="btn-primary">
            <Search className="h-4 w-4" />
            New Search
          </Link>
        ),
      };
    }

    if (pathname?.startsWith("/profile")) {
      return {
        title: "Account settings",
        icon: <User className="h-4 w-4" />,
      };
    }

    return {
      title: "Sourcing workspace",
      icon: <Search className="h-4 w-4" />,
      rightAction: (
        <Link href="/results" className="btn-secondary">
          <Database className="h-4 w-4" />
          Dashboard
        </Link>
      ),
    };
  }, [pathname]);

  const resolvedNav: NavbarConfig = useMemo(() => {
    if (!layout?.title) return navConfig;

    return {
      title: layout.title,
      icon: layout.icon ?? navConfig.icon,
      rightAction: layout.rightSlot ?? navConfig.rightAction,
    };
  }, [layout, navConfig]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-[rgba(243,245,247,0.92)] backdrop-blur">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="hidden h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900 lg:flex">
            {resolvedNav.icon}
          </div>
          <div className="min-w-0">
            <p className="section-label">Workspace</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">
              {resolvedNav.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex">{resolvedNav.rightAction}</div>
          {user === undefined ? (
            <div
              className="h-10 w-10 animate-pulse rounded-md border border-slate-300 bg-white"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-950"
              >
                {getInitials(getDisplayName(user))}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="section-label">Signed in as</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {getDisplayName(user)}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="page-shell flex flex-col gap-3 border-t border-slate-200 py-3 md:hidden">
        {resolvedNav.rightAction ? <div>{resolvedNav.rightAction}</div> : null}
        <div className="flex gap-2 overflow-x-auto">
          {internalNavigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn whitespace-nowrap ${active ? "border-blue-700 bg-blue-700 text-white hover:bg-blue-600" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
