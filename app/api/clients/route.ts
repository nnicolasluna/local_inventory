import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(clients, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener clientes" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, taxId, email, phone } = body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { error: "El nombre del cliente es obligatorio" },
                { status: 400 },
            );
        }

        const client = await prisma.client.create({
            data: {
                name: name.trim(),
                taxId: taxId?.trim() || null,
                email: email?.trim() || null,
                phone: phone?.trim() || null,
            },
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al crear cliente" },
            { status: 500 },
        );
    }
}
