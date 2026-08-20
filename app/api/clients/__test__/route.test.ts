/**
 * @jest-environment node
 */
import {
    POST as createClient,
    GET as getClients,
} from "@/app/api/clients/route";
import { DELETE as deleteClient } from "@/app/api/clients/[id]/route";
import {
    POST as createSupplier,
    GET as getSuppliers,
} from "@/app/api/suppliers/route";
import { DELETE as deleteSupplier } from "@/app/api/suppliers/[id]/route";
import { prisma } from "@/lib/prisma";

describe("Pruebas para Clients y Suppliers", () => {
    let createdClientId: string;
    let createdSupplierId: string;

    afterAll(async () => {
        await prisma.client.deleteMany({
            where: { name: { contains: "Test" } },
        });
        await prisma.supplier.deleteMany({
            where: { companyName: { contains: "Test" } },
        });
        await prisma.$disconnect();
    });

    describe("CRUD /api/clients", () => {
        it("debe crear un cliente correctamente", async () => {
            const req = new Request("http://localhost:3000/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Cliente Test",
                    taxId: "1234567",
                    email: "cliente@test.com",
                    phone: "70000000",
                }),
            });

            const res = await createClient(req);
            const data = await res.json();

            expect(res.status).toBe(201);
            expect(data.name).toBe("Cliente Test");
            expect(data.taxId).toBe("1234567");
            createdClientId = data.id;
        });

        it("debe listar los clientes", async () => {
            const res = await getClients();
            expect(res.status).toBe(200);
        });

        it("debe eliminar el cliente creado", async () => {
            const req = new Request(
                `http://localhost:3000/api/clients/${createdClientId}`,
                { method: "DELETE" },
            );
            const params = Promise.resolve({ id: createdClientId });
            const res = await deleteClient(req, { params });
            expect(res.status).toBe(200);
        });
    });

    describe("CRUD /api/suppliers", () => {
        it("debe crear un proveedor correctamente", async () => {
            const req = new Request("http://localhost:3000/api/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyName: "Distribuidora Test S.R.L.",
                    taxId: "987654321",
                    email: "contacto@distribuidoratest.com",
                    phone: "71111111",
                }),
            });

            const res = await createSupplier(req);
            const data = await res.json();

            expect(res.status).toBe(201);
            expect(data.companyName).toBe("Distribuidora Test S.R.L.");
            createdSupplierId = data.id;
        });

        it("debe listar los proveedores", async () => {
            const res = await getSuppliers();
            expect(res.status).toBe(200);
        });

        it("debe eliminar el proveedor creado", async () => {
            const req = new Request(
                `http://localhost:3000/api/suppliers/${createdSupplierId}`,
                { method: "DELETE" },
            );
            const params = Promise.resolve({ id: createdSupplierId });
            const res = await deleteSupplier(req, { params });
            expect(res.status).toBe(200);
        });
    });
});
