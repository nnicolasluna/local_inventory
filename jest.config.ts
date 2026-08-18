import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    // Ruta a la app de Next.js para cargar next.config.js y archivos .env
    dir: "./",
});

const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "node", // Usamos "node" para probar API Routes
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1", // Soporte para imports con @/
    },
};

export default createJestConfig(config);
