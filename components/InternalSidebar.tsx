"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
  Search,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useLocationHash } from "@/lib/useLocationHash";

const SIDEBAR_COLLAPSE_STORAGE_KEY = "lead-intel:internal-sidebar-collapsed";
const SIDEBAR_CONTENT_DELAY_MS = 140;

export const internalNavigation = [
  {
    href: "/results",
    label: "Dashboard",
    description: "Sessions and exports",
    icon: BarChart3,
  },
  {
    href: "/sourcer",
    label: "Sourcing Studio",
    description: "Launch searches and enrich data",
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
    description: "Account summary and details",
    icon: User,
  },
  {
    href: "/profile#usage",
    label: "Usage",
    description: "Credits and limits",
    icon: BarChart3,
  },
  {
    href: "/profile#billing",
    label: "Billing",
    description: "Plan and invoices",
    icon: CreditCard,
  },
  {
    href: "/profile#notifications",
    label: "Notifications",
    description: "Alerts and updates",
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

function getInitials(display: string) {
  if (!display) return "U";
  const parts = display.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function InternalSidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const hasLoadedCollapsePreferenceRef = useRef(false);
  const currentHash = useLocationHash();
  const isProfileRoute = pathname?.startsWith("/profile") ?? false;

  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isSidebarContentExpanded, setIsSidebarContentExpanded] =
    useState(true);
  const [profileOpen, setProfileOpen] = useState(() => isProfileRoute);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const frame = window.requestAnimationFrame(() => {
      const storedValue = window.localStorage.getItem(
        SIDEBAR_COLLAPSE_STORAGE_KEY,
      );

      hasLoadedCollapsePreferenceRef.current = true;

      if (storedValue === "true") {
        setIsSidebarContentExpanded(false);
        setIsCollapsed(true);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !hasLoadedCollapsePreferenceRef.current
    )
      return;

    window.localStorage.setItem(
      SIDEBAR_COLLAPSE_STORAGE_KEY,
      String(isCollapsed),
    );
  }, [isCollapsed]);

  const isSidebarExpanded = !isCollapsed || isHoverExpanded;

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setIsSidebarContentExpanded(isSidebarExpanded);
      },
      isSidebarExpanded ? SIDEBAR_CONTENT_DELAY_MS : 0,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSidebarExpanded]);

  const displayName = getDisplayName(user ?? null);
  const initials = getInitials(displayName);
  const isProfileSectionOpen = profileOpen;
  const isCompactSidebar = !isSidebarContentExpanded;

  const handleSidebarToggle = () => {
    setUserMenuOpen(false);
    setIsHoverExpanded(false);
    setIsCollapsed((value) => !value);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setUser(null);
      setUserMenuOpen(false);
      window.location.href = "/login";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error logging out");
    }
  };

  return (
    <aside
      className={`relative w-full shrink-0 transition-[flex-basis] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:w-auto ${isCollapsed ? "lg:basis-[88px]" : "lg:basis-[320px]"}`}
    >
      <div
        onMouseEnter={() => {
          if (isCollapsed) {
            setIsHoverExpanded(true);
          }
        }}
        onMouseLeave={() => {
          setIsHoverExpanded(false);
          setUserMenuOpen(false);
        }}
        className={`relative z-10 flex w-full flex-col border-b border-slate-800/80 bg-slate-950 text-white transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:fixed lg:left-[max(0px,calc((100vw-1920px)/2))] lg:top-0 lg:h-screen lg:overflow-visible lg:border-b-0 lg:border-r ${
          isSidebarExpanded ? "lg:w-[320px]" : "lg:w-[88px]"
        }`}
      >
        <div
          className={`border-b border-white/10 transition-all ${isCompactSidebar ? "px-2 py-3 lg:px-2" : "px-4 py-4 lg:px-5"}`}
        >
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className={`flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/5 ${
                isSidebarContentExpanded
                  ? ""
                  : "justify-center bg-transparent px-1 py-2 hover:bg-transparent"
              }`}
              aria-label="Go to homepage"
            >
              <div
                className={`flex shrink-0 items-center justify-center transition-all ${
                  isCompactSidebar
                    ? "h-9 w-9 rounded-xl bg-transparent text-blue-400 shadow-none"
                    : "h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20"
                }`}
              >
                <Zap className="h-6 w-6" fill="currentColor" />
              </div>
              {isSidebarContentExpanded && (
                <div className="min-w-0">
                  <p className="text-lg font-black tracking-tight text-white">
                    LeadIntel<span className="text-blue-400">Pro</span>
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    Lead intelligence workspace
                  </p>
                </div>
              )}
            </Link>
          </div>
        </div>

        <div
          className={`${
            isCompactSidebar ? "px-2 py-3 lg:px-2" : "px-3 py-4 lg:px-4"
          } lg:min-h-0 lg:flex-1 lg:overflow-y-auto`}
        >
          <div className="space-y-5">
            <div>
              <div
                className={`px-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 ${isSidebarContentExpanded ? "" : "sr-only"}`}
              >
                Workspace
              </div>
              <nav className="mt-3 space-y-2">
                {internalNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`group flex items-center gap-3 rounded-2xl border transition-all ${
                        isCompactSidebar
                          ? active
                            ? "border-transparent bg-transparent text-blue-300 shadow-none"
                            : "border-transparent bg-transparent text-slate-400 hover:border-transparent hover:bg-transparent hover:text-white"
                          : active
                            ? "border-blue-400/30 bg-white/10 text-white shadow-lg shadow-blue-500/10"
                            : "border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                      } ${isSidebarContentExpanded ? "px-4 py-4" : "justify-center px-2 py-2.5"}`}
                    >
                      <div
                        className={`flex shrink-0 items-center justify-center transition-all ${
                          isCompactSidebar
                            ? active
                              ? "h-9 w-9 rounded-lg bg-transparent text-blue-300 shadow-none"
                              : "h-9 w-9 rounded-lg bg-transparent text-slate-400 shadow-none group-hover:bg-transparent group-hover:text-white"
                            : active
                              ? "h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                              : "h-11 w-11 rounded-xl bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
                        }`}
                      >
                        <Icon
                          className={isCompactSidebar ? "h-4 w-4" : "h-5 w-5"}
                        />
                      </div>
                      {isSidebarContentExpanded && (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold tracking-tight">
                              {item.label}
                            </span>
                            <ArrowRight
                              className={`h-4 w-4 transition-transform ${active ? "translate-x-0 text-blue-300" : "text-slate-500 group-hover:translate-x-1 group-hover:text-white"}`}
                            />
                          </div>
                          <p
                            className={`mt-1 text-xs leading-relaxed ${active ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"}`}
                          >
                            {item.description}
                          </p>
                        </div>
                      )}
                    </Link>
                  );
                })}

                <div
                  className={`rounded-2xl transition-all ${
                    isSidebarContentExpanded
                      ? "border border-white/10 bg-white/[0.03] px-3 py-3"
                      : "border border-transparent bg-transparent px-0 py-0"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    aria-expanded={isProfileSectionOpen}
                    className={`flex w-full items-center gap-3 rounded-2xl text-left transition-all ${
                      isCompactSidebar
                        ? isProfileSectionOpen
                          ? "bg-transparent text-blue-300"
                          : "bg-transparent text-slate-400 hover:bg-transparent hover:text-white"
                        : isProfileSectionOpen
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                    } ${isSidebarContentExpanded ? "px-3 py-3" : "justify-center px-2 py-2.5"}`}
                  >
                    <div
                      className={`flex shrink-0 items-center justify-center transition-all ${
                        isCompactSidebar
                          ? isProfileSectionOpen
                            ? "h-9 w-9 rounded-lg bg-transparent text-blue-300 shadow-none"
                            : "h-9 w-9 rounded-lg bg-transparent text-slate-400 shadow-none group-hover:bg-transparent group-hover:text-white"
                          : isProfileSectionOpen
                            ? "h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                            : "h-11 w-11 rounded-xl bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
                      }`}
                    >
                      <User
                        className={isCompactSidebar ? "h-4 w-4" : "h-5 w-5"}
                      />
                    </div>
                    {isSidebarContentExpanded && (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold tracking-tight">
                            Profile
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${isProfileSectionOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Billing, credits, and account settings
                        </p>
                      </div>
                    )}
                  </button>

                  {isProfileSectionOpen && isSidebarContentExpanded ? (
                    <div className="mt-2 space-y-2">
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
                            onClick={() => {
                              setUserMenuOpen(false);
                              setProfileOpen(true);
                            }}
                            className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
                              active
                                ? "border-blue-400/20 bg-white/10 text-white shadow-lg shadow-blue-500/10"
                                : "border-transparent bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                                active
                                  ? "bg-white/15 text-white"
                                  : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold tracking-tight">
                                {item.label}
                              </div>
                              <div className="text-[11px] leading-relaxed text-slate-500">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </nav>
            </div>
          </div>
        </div>

        <div
          className={`transition-all ${isCompactSidebar ? "border-t border-transparent px-2 pb-3 pt-2 lg:px-2" : "border-t border-white/10 p-4 lg:p-4"}`}
        >
          {user === undefined ? (
            <div
              className={`flex items-center gap-3 rounded-[1.5rem] transition-all ${
                isCompactSidebar
                  ? "justify-center border border-transparent bg-transparent p-2"
                  : "border border-white/10 bg-white/5 p-4"
              }`}
            >
              <div
                className={`animate-pulse ${isCompactSidebar ? "h-9 w-9 rounded-xl bg-white/5" : "h-11 w-11 rounded-2xl bg-white/10"}`}
                aria-hidden="true"
              />
              {isSidebarContentExpanded && (
                <div className="space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                  <div className="h-2.5 w-36 animate-pulse rounded-full bg-white/10" />
                </div>
              )}
            </div>
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                className={`flex w-full items-center gap-3 rounded-[1.5rem] text-left transition ${
                  isCompactSidebar
                    ? "justify-center border border-transparent bg-transparent p-2 hover:bg-transparent"
                    : "border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                }`}
                aria-expanded={userMenuOpen}
              >
                <div
                  className={`flex shrink-0 items-center justify-center text-sm font-black text-white transition-all ${
                    isCompactSidebar
                      ? "h-9 w-9 rounded-xl bg-transparent shadow-none ring-1 ring-white/10"
                      : "h-11 w-11 rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/20"
                  }`}
                >
                  {initials}
                </div>
                {isSidebarContentExpanded && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user.email}
                    </p>
                  </div>
                )}
                {isSidebarContentExpanded && (
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {userMenuOpen && (
                <div
                  className={`absolute z-20 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-[0_24px_80px_-30px_rgba(2,6,23,0.85)] ${
                    isSidebarContentExpanded
                      ? "bottom-16 left-0 right-0"
                      : "bottom-0 left-full ml-3 w-56"
                  }`}
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                      Signed in as
                    </p>
                    <p className="truncate text-sm font-bold text-white">
                      {displayName}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/5"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex items-center justify-center gap-2 rounded-[1.5rem] text-sm font-bold text-white transition-transform ${
                isCompactSidebar
                  ? "border border-transparent bg-transparent px-2 py-2.5 hover:translate-y-0"
                  : "border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 px-5 py-4 shadow-lg shadow-blue-500/10 hover:-translate-y-0.5"
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              {isSidebarContentExpanded && <span>Get Started</span>}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={handleSidebarToggle}
          className="absolute right-0 top-1/2 z-20 hidden h-14 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-200 shadow-[0_16px_40px_-24px_rgba(2,6,23,0.85)] transition hover:border-slate-500 hover:text-white lg:inline-flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
