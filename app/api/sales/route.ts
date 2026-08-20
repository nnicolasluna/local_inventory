import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                client: true,
                user: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(sales, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener ventas" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clientId, userId, items } = body;

        if (!userId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                {
                    error: "El usuario y los ítems de la venta son obligatorios",
                },
                { status: 400 },
            );
        }

        // Procesamiento en transacción atómica
        const sale = await prisma.$transaction(async (tx) => {
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
                const stockAvailable = Number(product.stock);

                if (stockAvailable < qty) {
                    throw new Error(
                        `Stock insuficiente para el producto: ${product.name}`,
                    );
                }

                const unitPrice =
                    item.unitPrice !== undefined
                        ? Number(item.unitPrice)
                        : Number(product.salePrice);
                const subtotal = qty * unitPrice;
                totalAmount += subtotal;

                itemsToCreate.push({
                    productId: item.productId,
                    quantity: qty,
                    unitPrice,
                    subtotal,
                });

                // 1. Descontar stock del producto
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: qty } },
                });

                // 2. Registrar el movimiento de inventario (SALIDA)
                await tx.inventoryMovement.create({
                    data: {
                        productId: item.productId,
                        userId,
                        type: "SALIDA",
                        quantity: qty,
                        unitCost: product.costPrice,
                        referenceType: "VENTA",
                        notes: `Salida por venta`,
                    },
                });
            }

            // 3. Crear cabecera de venta con sus detalle e integrar referenceId en movimientos
            const newSale = await tx.sale.create({
                data: {
                    clientId: clientId || null,
                    userId,
                    totalAmount,
                    items: { createMany: { data: itemsToCreate } },
                },
                include: { items: true },
            });

            return newSale;
        });

        return NextResponse.json(sale, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error al procesar la venta" },
            { status: 400 },
        );
    }
}
