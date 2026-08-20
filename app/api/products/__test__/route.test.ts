/**
 * @jest-environment node
 */
import {
    POST as createProduct,
    GET as getProducts,
} from "@/app/api/products/route";
import { DELETE as deleteProduct } from "@/app/api/products/[id]/route";
import { prisma } from "@/lib/prisma";

describe("Pruebas para el módulo de Products", () => {
    // 1. DECLARACIÓN DE VARIABLES EN EL SCOPE GLOBAL DEL DESCRIBE
    let categoryId: string;
    let createdProductId: string;

    beforeAll(async () => {
        // Crear una categoría base requerida para la clave foránea
        const category = await prisma.category.create({
            data: { name: "Categoría Base Test" },
        });
        categoryId = category.id;
    });

    afterAll(async () => {
        // Limpieza de datos
        await prisma.product.deleteMany({
            where: { name: { contains: "Test" } },
        });
        await prisma.category.deleteMany({ where: { id: categoryId } });
        await prisma.$disconnect();
    });

    describe("CRUD /api/products", () => {
        it("debe crear un producto", async () => {
            const req = new Request("http://localhost:3000/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Producto Test",
                    sku: "SKU-TEST-001",
                    costPrice: 50.0,
                    salePrice: 99.99,
                    stock: 10,
                    minStock: 2,
                    categoryId: categoryId, // <--- Acceso correcto a la variable
                }),
            });

            const res = await createProduct(req);
            const data = await res.json();

            expect(res.status).toBe(201);
            expect(data.name).toBe("Producto Test");
            expect(data.sku).toBe("SKU-TEST-001");

            // Asignación de ID para las siguientes pruebas
            createdProductId = data.id;
        });

        it("debe listar productos", async () => {
            const res = await getProducts();
            expect(res.status).toBe(200);
        });

        it("debe eliminar el producto", async () => {
            const req = new Request(
                `http://localhost:3000/api/products/${createdProductId}`,
                {
                    method: "DELETE",
                },
            );
            const params = Promise.resolve({ id: createdProductId });

            const res = await deleteProduct(req, { params });
            expect(res.status).toBe(200);
        });
    });
});
