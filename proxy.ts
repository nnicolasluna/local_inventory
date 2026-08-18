import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function proxy(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value;
    const { pathname } = req.nextUrl;

    // Rutas públicas
    if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        if (token && (await verifyToken(token))) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    // Verificar autenticación para rutas protegidas
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/inventory") ||
        pathname.startsWith("/sales")
    ) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Control de acceso RBAC por Rol
        if (pathname.startsWith("/inventory") && payload.role === "CAJERO") {
            return NextResponse.redirect(
                new URL("/dashboard?error=unauthorized", req.url),
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/inventory/:path*",
        "/sales/:path*",
        "/login",
        "/signup",
    ],
};
