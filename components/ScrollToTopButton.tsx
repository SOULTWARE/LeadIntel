"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const VISIBILITY_OFFSET = 520;

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextVisible = window.scrollY > VISIBILITY_OFFSET;
      setIsVisible((currentVisible) =>
        currentVisible === nextVisible ? currentVisible : nextVisible
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      aria-label="Go to top"
      title="Go to top"
      onClick={handleClick}
      className={`fixed bottom-5 right-5 z-[120] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-slate-950 text-white shadow-[0_18px_44px_-20px_rgba(15,23,42,0.7)] backdrop-blur-xl transition-all duration-200 md:bottom-8 md:right-8 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
