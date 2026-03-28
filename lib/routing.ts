export const publicSitePaths = [
  "/",
  "/about",
  "/blog",
  "/contact",
  "/pricing",
  "/privacy",
  "/terms",
] as const;

const protectedAppPrefixes = ["/profile", "/results", "/sourcer"] as const;

export function isProtectedAppPath(pathname: string) {
  return protectedAppPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
