import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isRootAdmin = req.nextUrl.pathname.startsWith("/admin");

    // Si intenta entrar a /admin y no es ADMIN, redirigir
    if (isRootAdmin && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Si hay token, está autorizado
    },
  }
);

// Aquí defines qué rutas están protegidas
export const config = { matcher: ["/admin/:path*", "/cocina/:path*", "/api/orders/:path*"] };