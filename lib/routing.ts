export const publicSitePaths = [
  "/",
  "/about",
  "/contact",
  "/how-to-find-b2b-leads",
  "/pricing",
  "/privacy",
  "/terms",
] as const;

const protectedAppPrefixes = ["/profile", "/results", "/sourcer"] as const;

export function isProtectedAppPath(pathname: string) {
  return protectedAppPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
