import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            client: true,
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
        },
    });

    if (!sale)
        return NextResponse.json(
            { error: "Venta no encontrada" },
            { status: 404 },
        );
    return NextResponse.json(sale, { status: 200 });
}
