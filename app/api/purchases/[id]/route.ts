import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
    const { id } = await params;
    const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
            supplier: true,
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
        },
    });

    if (!purchase)
        return NextResponse.json(
            { error: "Compra no encontrada" },
            { status: 404 },
        );
    return NextResponse.json(purchase, { status: 200 });
}
