import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(suppliers, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener proveedores" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { companyName, taxId, email, phone } = body;

        if (
            !companyName ||
            typeof companyName !== "string" ||
            companyName.trim() === ""
        ) {
            return NextResponse.json(
                {
                    error: "El nombre de la empresa (companyName) es obligatorio",
                },
                { status: 400 },
            );
        }

        const supplier = await prisma.supplier.create({
            data: {
                companyName: companyName.trim(),
                taxId: taxId?.trim() || null,
                email: email?.trim() || null,
                phone: phone?.trim() || null,
            },
        });

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al crear proveedor" },
            { status: 500 },
        );
    }
}
