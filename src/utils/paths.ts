/** Prefix site-local absolute paths while leaving external and fragment URLs untouched. */
export function sitePath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (base && (path === base || path.startsWith(`${base}/`))) return path;
  return `${base}${path}`;
}
