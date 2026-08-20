import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                supplier: true,
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(purchases, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener compras" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { supplierId, userId, items } = body;

        if (
            !supplierId ||
            !userId ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return NextResponse.json(
                {
                    error: "El proveedor, usuario y los ítems de compra son obligatorios",
                },
                { status: 400 },
            );
        }

        const purchase = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const itemsToCreate = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new Error(
                        `Producto no encontrado: ${item.productId}`,
                    );
                }

                const qty = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);
                const subtotal = qty * unitPrice;
                totalAmount += subtotal;

                itemsToCreate.push({
                    productId: item.productId,
                    quantity: qty,
                    unitPrice,
                    subtotal,
                });

                // 1. Incrementar stock y actualizar precio de costo
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: qty },
                        costPrice: unitPrice, // Actualización al costo de la última compra
                    },
                });

                // 2. Registrar movimiento de inventario (ENTRADA)
                await tx.inventoryMovement.create({
                    data: {
                        productId: item.productId,
                        userId,
                        type: "ENTRADA",
                        quantity: qty,
                        unitCost: unitPrice,
                        referenceType: "COMPRA",
                        notes: `Entrada por compra a proveedor`,
                    },
                });
            }

            // 3. Crear la compra
            const newPurchase = await tx.purchase.create({
                data: {
                    supplierId,
                    userId,
                    totalAmount,
                    items: { createMany: { data: itemsToCreate } },
                },
                include: { items: true },
            });

            return newPurchase;
        });

        return NextResponse.json(purchase, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error al procesar la compra" },
            { status: 400 },
        );
    }
}
