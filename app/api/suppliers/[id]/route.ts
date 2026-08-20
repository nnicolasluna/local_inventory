import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
        return NextResponse.json(
            { error: "Proveedor no encontrado" },
            { status: 404 },
        );
    }
    return NextResponse.json(supplier, { status: 200 });
}

export async function PUT(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();

        const existingSupplier = await prisma.supplier.findUnique({
            where: { id },
        });
        if (!existingSupplier) {
            return NextResponse.json(
                { error: "Proveedor no encontrado" },
                { status: 404 },
            );
        }

        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                companyName: body.companyName
                    ? body.companyName.trim()
                    : existingSupplier.companyName,
                taxId:
                    body.taxId !== undefined
                        ? body.taxId?.trim()
                        : existingSupplier.taxId,
                email:
                    body.email !== undefined
                        ? body.email?.trim()
                        : existingSupplier.email,
                phone:
                    body.phone !== undefined
                        ? body.phone?.trim()
                        : existingSupplier.phone,
            },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al actualizar proveedor" },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        await prisma.supplier.delete({ where: { id } });
        return NextResponse.json(
            { message: "Proveedor eliminado correctamente" },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Error al eliminar proveedor" },
            { status: 500 },
        );
    }
}
