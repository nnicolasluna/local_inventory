/**
 * @jest-environment node
 */
import {
    GET as getCategories,
    POST as createCategory,
} from "@/app/api/categories/route";
import {
    GET as getCategoryById,
    PUT as updateCategory,
    DELETE as deleteCategory,
} from "@/app/api/categories/[id]/route";
import { prisma } from "@/lib/prisma";

describe("API Route Handler: /api/categories", () => {
    let createdCategoryId: string;
    const categoryName = "Electrónicos Test";

    afterAll(async () => {
        // Limpieza de datos en la base de datos de prueba
        await prisma.category.deleteMany({
            where: { name: { contains: "Test" } },
        });
        await prisma.$disconnect();
    });

    describe("POST /api/categories", () => {
        it("debe crear una nueva categoría exitosamente", async () => {
            const req = new Request("http://localhost:3000/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: categoryName,
                    description: "Categoría para pruebas de software",
                }),
            });

            const res = await createCategory(req);
            const data = await res.json();

            expect(res.status).toBe(201);
            expect(data.id).toBeDefined();
            expect(data.name).toBe(categoryName);

            createdCategoryId = data.id; // Almacenamos el ID para los siguientes tests
        });

        it("debe rechazar la creación si el nombre ya existe", async () => {
            const req = new Request("http://localhost:3000/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: categoryName }),
            });

            const res = await createCategory(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe("Ya existe una categoría con ese nombre");
        });

        it("debe rechazar la creación si falta el campo obligatorio name", async () => {
            const req = new Request("http://localhost:3000/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: "Sin nombre" }),
            });

            const res = await createCategory(req);
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe("El nombre de la categoría es obligatorio");
        });
    });

    describe("GET /api/categories", () => {
        it("debe retornar el listado de categorías", async () => {
            const res = await getCategories();
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
        });
    });

    describe("GET /api/categories/[id]", () => {
        it("debe obtener los detalles de una categoría específica por ID", async () => {
            const req = new Request(
                `http://localhost:3000/api/categories/${createdCategoryId}`,
            );
            const params = Promise.resolve({ id: createdCategoryId });

            const res = await getCategoryById(req, { params });
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.id).toBe(createdCategoryId);
            expect(data.name).toBe(categoryName);
        });

        it("debe retornar 404 si el ID de la categoría no existe", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const req = new Request(
                `http://localhost:3000/api/categories/${fakeId}`,
            );
            const params = Promise.resolve({ id: fakeId });

            const res = await getCategoryById(req, { params });
            const data = await res.json();

            expect(res.status).toBe(404);
            expect(data.error).toBe("Categoría no encontrada");
        });
    });

    describe("PUT /api/categories/[id]", () => {
        it("debe actualizar el nombre y descripción de una categoría", async () => {
            const updatedName = "Electrónicos Editado Test";
            const req = new Request(
                `http://localhost:3000/api/categories/${createdCategoryId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: updatedName,
                        description: "Nueva descripción editada",
                    }),
                },
            );
            const params = Promise.resolve({ id: createdCategoryId });

            const res = await updateCategory(req, { params });
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.name).toBe(updatedName);
            expect(data.description).toBe("Nueva descripción editada");
        });
    });

    describe("DELETE /api/categories/[id]", () => {
        it("debe eliminar la categoría correctamente", async () => {
            const req = new Request(
                `http://localhost:3000/api/categories/${createdCategoryId}`,
                {
                    method: "DELETE",
                },
            );
            const params = Promise.resolve({ id: createdCategoryId });

            const res = await deleteCategory(req, { params });
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.message).toBe("Categoría eliminada correctamente");
        });
    });
});
