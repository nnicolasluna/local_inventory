import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener historial de movimientos del Kardex
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        const movements = await prisma.inventoryMovement.findMany({
            where: productId ? { productId } : {},
            include: {
                product: true,
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(movements, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener movimientos de inventario" },
            { status: 500 },
        );
    }
}

// POST: Registrar un movimiento manual (Ajustes / Mermas)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            productId,
            userId,
            type,
            quantity,
            unitCost,
            referenceType,
            notes,
        } = body;

        if (
            !productId ||
            !userId ||
            !type ||
            quantity === undefined ||
            !referenceType
        ) {
            return NextResponse.json(
                { error: "Campos requeridos faltantes" },
                { status: 400 },
            );
        }

        const qty = Number(quantity);

        const movement = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: productId },
            });
            if (!product) throw new Error("Producto no encontrado");

            // Actualizar el stock según el tipo de movimiento
            if (type === "ENTRADA") {
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { increment: qty } },
                });
            } else if (type === "SALIDA") {
                if (Number(product.stock) < qty) {
                    throw new Error(
                        "Stock insuficiente para realizar el ajuste",
                    );
                }
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: qty } },
                });
            }

            return await tx.inventoryMovement.create({
                data: {
                    productId,
                    userId,
                    type,
                    quantity: qty,
                    unitCost:
                        unitCost !== undefined
                            ? Number(unitCost)
                            : product.costPrice,
                    referenceType,
                    notes: notes?.trim() || null,
                },
            });
        });

        return NextResponse.json(movement, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error al registrar el movimiento" },
            { status: 400 },
        );
    }
}
