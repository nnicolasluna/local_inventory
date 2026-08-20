import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener todas las categorías
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        return NextResponse.json(
            { error: "Error al obtener las categorías" },
            { status: 500 },
        );
    }
}

// POST: Crear una nueva categoría
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { error: "El nombre de la categoría es obligatorio" },
                { status: 400 },
            );
        }

        const existingCategory = await prisma.category.findUnique({
            where: { name: name.trim() },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: "Ya existe una categoría con ese nombre" },
                { status: 400 },
            );
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error al crear categoría:", error);
        return NextResponse.json(
            { error: "Error al crear la categoría" },
            { status: 500 },
        );
    }
}
