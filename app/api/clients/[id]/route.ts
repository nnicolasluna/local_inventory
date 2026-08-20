import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
    const { id } = await params;
    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
        return NextResponse.json(
            { error: "Cliente no encontrado" },
            { status: 404 },
        );
    }
    return NextResponse.json(client, { status: 200 });
}

export async function PUT(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();

        const existingClient = await prisma.client.findUnique({
            where: { id },
        });
        if (!existingClient) {
            return NextResponse.json(
                { error: "Cliente no encontrado" },
                { status: 404 },
            );
        }

        const updated = await prisma.client.update({
            where: { id },
            data: {
                name: body.name ? body.name.trim() : existingClient.name,
                taxId:
                    body.taxId !== undefined
                        ? body.taxId?.trim()
                        : existingClient.taxId,
                email:
                    body.email !== undefined
                        ? body.email?.trim()
                        : existingClient.email,
                phone:
                    body.phone !== undefined
                        ? body.phone?.trim()
                        : existingClient.phone,
            },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al actualizar cliente" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        await prisma.client.delete({ where: { id } });
        return NextResponse.json(
            { message: "Cliente eliminado correctamente" },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Error al eliminar cliente" },
            { status: 500 },
        );
    }
}
