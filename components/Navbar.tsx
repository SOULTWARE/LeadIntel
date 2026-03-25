"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, LogOut, Menu, Search, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import BrandMark from "@/components/BrandMark";

interface NavbarProps {
  user: SupabaseUser | null;
}

const marketingLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function getDisplayName(user: SupabaseUser | null) {
  if (!user) return "";
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";
  return metaName.trim() || user.email || "";
}

function getInitials(displayName: string) {
  if (!displayName) return "U";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setUserMenuOpen(false);
      setMenuOpen(false);
      router.refresh();
    } catch {
      toast.error("Error logging out");
    }
  };

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-[rgba(243,245,247,0.92)] backdrop-blur">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-3">
        <BrandMark />

        <nav className="hidden items-center gap-2 lg:flex">
          {marketingLinks.map((item) => (
            <Link key={item.href} href={item.href} className="btn-ghost">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link href="/sourcer" className="btn-primary">
                <Search className="h-4 w-4" />
                Workspace
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-900"
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <p className="section-label">Signed in as</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                        {displayName}
                      </p>
                    </div>
                    <Link
                      href="/results"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
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
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/login" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="btn-secondary px-3 lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="page-shell flex flex-col gap-3 py-4">
            {marketingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="btn-secondary justify-start"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/sourcer"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary justify-start"
                >
                  <Search className="h-4 w-4" />
                  Workspace
                </Link>
                <Link
                  href="/results"
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary justify-start"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary justify-start"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-danger justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="btn-secondary justify-start"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary justify-start"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
