import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Listar todos los productos
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener productos" },
            { status: 500 },
        );
    }
}

// POST: Crear producto
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            sku,
            categoryId,
            costPrice,
            salePrice,
            stock,
            minStock,
            description,
        } = body;

        if (!name || !sku || !categoryId) {
            return NextResponse.json(
                { error: "El nombre, SKU y categoría son obligatorios" },
                { status: 400 },
            );
        }

        const existingSku = await prisma.product.findUnique({
            where: { sku: sku.trim() },
        });

        if (existingSku) {
            return NextResponse.json(
                { error: "El SKU ya está registrado" },
                { status: 400 },
            );
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                sku: sku.trim(),
                categoryId,
                description: description?.trim() || null,
                costPrice: costPrice !== undefined ? Number(costPrice) : 0,
                salePrice: salePrice !== undefined ? Number(salePrice) : 0,
                stock: stock !== undefined ? Number(stock) : 0,
                minStock: minStock !== undefined ? Number(minStock) : 0,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error al crear producto:", error);
        return NextResponse.json(
            { error: "Error al crear producto" },
            { status: 500 },
        );
    }
}
