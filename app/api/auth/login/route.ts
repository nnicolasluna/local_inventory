import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Ingresa correo y contraseña" },
                { status: 400 },
            );
        }

        // 1. Buscar el usuario incluyendo su rol
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });

        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: "Credenciales inválidas o usuario inactivo" },
                { status: 401 },
            );
        }

        // 2. Validar contraseña
        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Credenciales inválidas" },
                { status: 401 },
            );
        }

        // 3. Generar JWT
        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role.name,
        });

        // 4. Guardar Cookie
        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8, // 8 horas
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            },
        });
    } catch (error) {
        console.error("Error en login:", error);
        return NextResponse.json(
            { error: "Error al iniciar sesión" },
            { status: 500 },
        );
    }
}
