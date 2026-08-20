/**
 * @jest-environment node
 */
import { GET as getSuppliers, POST as createSupplier } from "../route";
import { prisma } from "@/lib/prisma";

describe("API Route Handler: /api/suppliers", () => {
    let createdSupplierId: string;

    afterAll(async () => {
        await prisma.supplier.deleteMany({
            where: { companyName: { contains: "Test" } },
        });
        await prisma.$disconnect();
    });

    it("debe registrar un proveedor exitosamente", async () => {
        const req = new Request("http://localhost:3000/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                companyName: "Proveedor Test S.R.L.",
                taxId: "123456789",
                email: "contacto@proveedortest.com",
                phone: "70000000",
            }),
        });

        const res = await createSupplier(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.companyName).toBe("Proveedor Test S.R.L.");
        createdSupplierId = data.id;
    });

    it("debe obtener la lista de proveedores", async () => {
        const res = await getSuppliers();
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
    });
});
