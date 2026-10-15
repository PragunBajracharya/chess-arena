/** Where to go after signing in: the ?next= path if it is a local path, else home. */
export function nextPath() {
  if (typeof window === "undefined") return "/home";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}
