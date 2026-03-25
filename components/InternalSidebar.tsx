"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/BrandMark";

export const internalNavigation = [
  {
    href: "/results",
    label: "Dashboard",
    description: "Sessions, exports, and saved prospects",
    icon: BarChart3,
  },
  {
    href: "/sourcer",
    label: "Sourcing",
    description: "Launch new searches and review live results",
    icon: Search,
  },
] satisfies Array<{
  href: string;
  label: string;
  description: string;
  icon: ElementType;
}>;

const profileNavigation = [
  {
    href: "/profile",
    label: "Overview",
    description: "Identity and account controls",
    icon: User,
  },
  {
    href: "/profile#usage",
    label: "Usage",
    description: "Credits and consumption",
    icon: BarChart3,
  },
  {
    href: "/profile#billing",
    label: "Billing",
    description: "Subscription and payment settings",
    icon: CreditCard,
  },
  {
    href: "/profile#notifications",
    label: "Alerts",
    description: "Workspace notifications",
    icon: Bell,
  },
] satisfies Array<{
  href: string;
  label: string;
  description: string;
  icon: ElementType;
}>;

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getDisplayName(user: SupabaseUser | null) {
  if (!user) return "";
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";
  return metaName.trim() || user.email || "";
}

export default function InternalSidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncHash = () => setCurrentHash(window.location.hash || "");

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  const displayName = getDisplayName(user ?? null);
  const isProfileRoute = pathname?.startsWith("/profile") ?? false;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error logging out");
    }
  };

  return (
    <aside
      className={`hidden shrink-0 border-r border-slate-800 bg-slate-950 text-white lg:flex ${isCollapsed ? "lg:w-24" : "lg:w-72"}`}
    >
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
          <BrandMark compact={isCollapsed} inverted />
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:bg-slate-800"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-6">
            <section className="space-y-2">
              {!isCollapsed && (
                <div className="section-label text-slate-400">Workspace</div>
              )}
              <nav className="space-y-1">
                {internalNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center gap-3 rounded-md border px-3 py-3 transition-colors ${
                        active
                          ? "border-blue-500/40 bg-blue-600/10 text-white"
                          : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-white"
                      } ${isCollapsed ? "justify-center px-2" : ""}`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                          active
                            ? "border-blue-500/50 bg-blue-600/20 text-blue-200"
                            : "border-slate-800 bg-slate-900 text-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-400">
                            {item.description}
                          </span>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </section>

            <section className="space-y-2">
              {!isCollapsed && (
                <div className="section-label text-slate-400">Account</div>
              )}
              <nav className="space-y-1">
                {profileNavigation.map((item) => {
                  const Icon = item.icon;
                  const hashTarget = item.href.includes("#")
                    ? `#${item.href.split("#")[1]}`
                    : "";
                  const active =
                    isProfileRoute &&
                    (item.href === "/profile"
                      ? currentHash === "" || currentHash === "#profile"
                      : currentHash === hashTarget);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center gap-3 rounded-md border px-3 py-3 transition-colors ${
                        active
                          ? "border-slate-700 bg-slate-900 text-white"
                          : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-white"
                      } ${isCollapsed ? "justify-center px-2" : ""}`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-900">
                        <Icon className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-400">
                            {item.description}
                          </span>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </section>
          </div>
        </div>

        <div className="border-t border-slate-800 p-3">
          {user === undefined ? (
            <div className="space-y-2 rounded-md border border-slate-800 bg-slate-900 p-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
              {!isCollapsed && (
                <div className="h-3 w-40 animate-pulse rounded bg-slate-800" />
              )}
            </div>
          ) : user ? (
            <div className="space-y-3 rounded-md border border-slate-800 bg-slate-900 p-3">
              {!isCollapsed && (
                <div>
                  <div className="text-sm font-semibold text-white">
                    {displayName}
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {user.email}
                  </div>
                </div>
              )}
              <div className={`flex gap-2 ${isCollapsed ? "flex-col" : ""}`}>
                <Link
                  href="/profile"
                  className="btn-secondary flex-1 justify-center border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
                >
                  <User className="h-4 w-4" />
                  {!isCollapsed && "Profile"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-danger flex-1 justify-center border-rose-800 bg-rose-700/90 hover:bg-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && "Sign Out"}
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary w-full justify-center">
              <User className="h-4 w-4" />
              {!isCollapsed && "Sign In"}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
