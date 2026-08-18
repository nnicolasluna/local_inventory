import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { RoleName } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role: inputRole } = body;
        const roleName: RoleName = inputRole || RoleName.CAJERO;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Todos los campos son obligatorios" },
                { status: 400 },
            );
        }

        // 1. Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "El correo electrónico ya está registrado" },
                { status: 409 },
            );
        }

        // 2. Buscar o crear el rol seleccionado
        let role = await prisma.role.findUnique({
            where: { name: roleName },
        });

        if (!role) {
            role = await prisma.role.create({
                data: { name: roleName },
            });
        }

        // 3. Hashear la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Crear el usuario
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                roleId: role.id,
            },
            include: {
                role: true,
            },
        });

        // 5. Generar Token de sesión
        const token = await signToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role.name,
        });

        // 6. Guardar Token en Cookie HTTP-Only
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
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role.name,
            },
        });
    } catch (error) {
        console.error("Error en signup:", error);
        return NextResponse.json(
            { error: "Error al registrar el usuario" },
            { status: 500 },
        );
    }
}
