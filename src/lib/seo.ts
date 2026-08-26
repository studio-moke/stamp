export const SITE_NAME = "STAMP MOKE";
export const SITE_URL = "https://stamp-moke.jp";

export function makeTitle(parts: string[]) {
  return [...parts.filter(Boolean), SITE_NAME].join(" | ");
}

export function makeDescription(text: string, fallback: string) {
  const value = (text || fallback).replace(/\s+/g, " ").trim();
  return value.length > 155 ? `${value.slice(0, 152)}...` : value;
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
