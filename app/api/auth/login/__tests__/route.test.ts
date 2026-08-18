import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 1. Mocks de librerías externas
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("bcryptjs", () => ({
    __esModule: true,
    default: {
        compare: jest.fn(),
    },
}));

jest.mock("next/headers", () => ({
    cookies: jest.fn().mockResolvedValue({ set: jest.fn() }),
}));

jest.mock("@/lib/jwt", () => ({
    signToken: jest.fn().mockResolvedValue("fake-jwt-token"),
}));

describe("POST /api/auth/login", () => {
    // Limpiar contadores y respuestas de mocks antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // -------------------------------------------------------------
    // 1. VALIDACIÓN DE ENTRADA (BAD REQUEST - 400)
    // -------------------------------------------------------------
    it("debe retornar 400 si faltan email o password", async () => {
        const req = new Request("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@sistema.local" }), // Falta password
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Ingresa correo y contraseña");
    });

    // -------------------------------------------------------------
    // 2. USUARIOS INEXISTENTES (UNAUTHORIZED - 401)
    // -------------------------------------------------------------
    it("debe retornar 401 si el usuario no existe en la base de datos", async () => {
        // Simular que Prisma no encuentra ningún usuario con ese email
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new Request("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "noexiste@sistema.local",
                password: "Admin123!",
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe("Credenciales inválidas o usuario inactivo");
    });

    // -------------------------------------------------------------
    // 3. USUARIO INACTIVO (UNAUTHORIZED - 401)
    // -------------------------------------------------------------
    it("debe retornar 401 si el usuario existe pero isActive es false", async () => {
        // Simular un usuario inactivo
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "usr-inactivo-123",
            name: "Usuario Inactivo",
            email: "inactivo@sistema.local",
            passwordHash: "$2a$10$hashedpassword",
            isActive: false, // 👈 Inactivo
            role: { name: "OPERADOR" },
        });

        const req = new Request("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "inactivo@sistema.local",
                password: "Admin123!",
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe("Credenciales inválidas o usuario inactivo");
    });

    // -------------------------------------------------------------
    // 4. CONTRASEÑA INCORRECTA (UNAUTHORIZED - 401)
    // -------------------------------------------------------------
    it("debe retornar 401 si la contraseña no coincide", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "9f38b68a-9b31-4db1-913d-d1ced0336f5c",
            name: "Super Admin",
            email: "admin@sistema.local",
            passwordHash: "$2a$10$hashedpassword",
            isActive: true,
            role: { name: "ADMIN" },
        });

        // Simular que bcrypt compara las contraseñas y NO coinciden
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const req = new Request("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@sistema.local",
                password: "ContraseñaIncorrecta123",
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.error).toBe("Credenciales inválidas");
    });

    // -------------------------------------------------------------
    // 5. CASO ÉXITO (OK - 200)
    // -------------------------------------------------------------
    it("debe retornar 200 y los datos del usuario si las credenciales son válidas", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "9f38b68a-9b31-4db1-913d-d1ced0336f5c",
            name: "Super Admin",
            email: "admin@sistema.local",
            passwordHash: "$2a$10$hashedpassword",
            isActive: true,
            role: { name: "ADMIN" },
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const req = new Request("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@sistema.local",
                password: "Admin123!",
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({
            success: true,
            user: {
                id: "9f38b68a-9b31-4db1-913d-d1ced0336f5c",
                name: "Super Admin",
                email: "admin@sistema.local",
                role: "ADMIN",
            },
        });
    });

});
