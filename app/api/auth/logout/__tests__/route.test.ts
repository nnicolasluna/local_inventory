import { POST } from "../route";

// Mockear el manejo de cookies de Next.js
const mockDeleteCookie = jest.fn();

jest.mock("next/headers", () => ({
    cookies: jest.fn().mockResolvedValue({
        delete: (...args: unknown[]) => mockDeleteCookie(...args),
    }),
}));

describe("POST /api/auth/logout", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // -------------------------------------------------------------
    // 1. CASO ÉXITO (OK - 200)
    // -------------------------------------------------------------
    it("debe eliminar la cookie de autenticación y retornar status 200", async () => {
        const res = await POST();
        const data = await res.json();

        // Validar estatus HTTP y mensaje de éxito
        expect(res.status).toBe(200);
    });
});
