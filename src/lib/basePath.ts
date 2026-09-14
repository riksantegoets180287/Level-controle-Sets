const BASE_PATH = "/levelcontrole";

export function getBasePath(): string {
  return BASE_PATH;
}

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return `${BASE_PATH}${path}`;
}

export function stripBasePath(pathname: string): string {
  if (pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }
  return pathname;
}

export function getFullShareUrl(slug: string): string {
  return `${window.location.origin}${withBasePath("/set/")}${slug}`;
}
