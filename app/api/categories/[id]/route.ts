import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
    params: Promise<{ id: string }>;
}

// GET: Obtener una categoría por ID
export async function GET(req: Request, { params }: Params) {
    try {
        const { id } = await params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: { products: true },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Categoría no encontrada" },
                { status: 404 },
            );
        }

        return NextResponse.json(category, { status: 200 });
    } catch (error) {
        console.error("Error al obtener la categoría:", error);
        return NextResponse.json(
            { error: "Error al obtener la categoría" },
            { status: 500 },
        );
    }
}

// PUT / PATCH: Actualizar una categoría
export async function PUT(req: Request, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, description } = body;

        const existingCategory = await prisma.category.findUnique({
            where: { id },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Categoría no encontrada" },
                { status: 404 },
            );
        }

        if (name && name.trim() !== existingCategory.name) {
            const duplicateName = await prisma.category.findUnique({
                where: { name: name.trim() },
            });

            if (duplicateName) {
                return NextResponse.json(
                    { error: "Ya existe otra categoría con este nombre" },
                    { status: 400 },
                );
            }
        }

        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                name: name ? name.trim() : existingCategory.name,
                description:
                    description !== undefined
                        ? description?.trim()
                        : existingCategory.description,
            },
        });

        return NextResponse.json(updatedCategory, { status: 200 });
    } catch (error) {
        console.error("Error al actualizar categoría:", error);
        return NextResponse.json(
            { error: "Error al actualizar la categoría" },
            { status: 500 },
        );
    }
}

// DELETE: Eliminar una categoría
export async function DELETE(req: Request, { params }: Params) {
    try {
        const { id } = await params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Categoría no encontrada" },
                { status: 404 },
            );
        }

        // Validar integridad relacional (Evitar borrar si hay productos asociados)
        if (category._count.products > 0) {
            return NextResponse.json(
                {
                    error: "No se puede eliminar la categoría porque tiene productos asociados",
                },
                { status: 400 },
            );
        }

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Categoría eliminada correctamente" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        return NextResponse.json(
            { error: "Error al eliminar la categoría" },
            { status: 500 },
        );
    }
}
