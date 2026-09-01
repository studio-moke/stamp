export const SITE_NAME = "stamp moke";
export const SITE_URL = "https://stamp-moke.jp";

export function makeTitle(parts: string[]) {
  return [...parts.filter(Boolean), SITE_NAME].join(" | ");
}

export function makeDescription(text: string, fallback: string) {
  const value = (text || fallback).replace(/\s+/g, " ").trim();
  return value.length > 155 ? `${value.slice(0, 152)}...` : value;
}

function normalizeInternalPath(path: string) {
  const value = String(path || "/");
  if (!value.startsWith("/")) return value;

  const [pathname, suffix = ""] = value.split(/(?=[?#])/s, 2);
  if (
    pathname === "/" ||
    pathname.startsWith("/api/") ||
    /\/[^/]+\.[a-z0-9]+$/i.test(pathname) ||
    pathname.endsWith("/")
  ) {
    return `${pathname}${suffix}`;
  }
  return `${pathname}/${suffix}`;
}

export function absoluteUrl(path: string) {
  return new URL(normalizeInternalPath(path), SITE_URL).toString();
}
