import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

// GET por ID
export async function GET(req: Request, { params }: Params) {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
    });
    if (!product)
        return NextResponse.json(
            { error: "Producto no encontrado" },
            { status: 404 },
        );
    return NextResponse.json(product, { status: 200 });
}

// PUT: Actualizar producto
export async function PUT(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();

        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });
        if (!existingProduct) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 },
            );
        }

        if (body.sku && body.sku.trim() !== existingProduct.sku) {
            const duplicateSku = await prisma.product.findUnique({
                where: { sku: body.sku.trim() },
            });
            if (duplicateSku) {
                return NextResponse.json(
                    { error: "El SKU ya pertenece a otro producto" },
                    { status: 400 },
                );
            }
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                name: body.name ? body.name.trim() : existingProduct.name,
                sku: body.sku ? body.sku.trim() : existingProduct.sku,
                description:
                    body.description !== undefined
                        ? body.description?.trim()
                        : existingProduct.description,
                costPrice:
                    body.costPrice !== undefined
                        ? Number(body.costPrice)
                        : existingProduct.costPrice,
                salePrice:
                    body.salePrice !== undefined
                        ? Number(body.salePrice)
                        : existingProduct.salePrice,
                stock:
                    body.stock !== undefined
                        ? Number(body.stock)
                        : existingProduct.stock,
                minStock:
                    body.minStock !== undefined
                        ? Number(body.minStock)
                        : existingProduct.minStock,
                categoryId: body.categoryId || existingProduct.categoryId,
                isActive:
                    body.isActive !== undefined
                        ? Boolean(body.isActive)
                        : existingProduct.isActive,
            },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al actualizar producto" },
            { status: 500 },
        );
    }
}

// DELETE: Eliminar producto
export async function DELETE(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        await prisma.product.delete({ where: { id } });
        return NextResponse.json(
            { message: "Producto eliminado correctamente" },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Error al eliminar producto" },
            { status: 500 },
        );
    }
}
