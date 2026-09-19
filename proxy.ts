import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const locale = request.nextUrl.pathname.split("/")[1];
  const headers = new Headers(request.headers);
  headers.set(
    "x-agriedge-locale",
    ["en", "hi", "mr"].includes(locale) ? locale : "en",
  );
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: ["/", "/en/:path*", "/hi/:path*", "/mr/:path*"],
};
