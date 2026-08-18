import { PrismaClient, RoleName } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const sqlite = new Database("dev.db");
const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });


async function main() {
    console.log("🌱 Iniciando la siembra de la base de datos...");

    // 1. Crear Roles por defecto
    const roles = [
        { name: RoleName.ADMIN, description: "Administrador del sistema" },
        { name: RoleName.CAJERO, description: "Operador de punto de venta" },
        {
            name: RoleName.ALMACEN,
            description: "Encargado de inventario y stock",
        },
        {
            name: RoleName.CONTADOR,
            description: "Gestión contable y financiera",
        },
    ];

    for (const roleData of roles) {
        await prisma.role.upsert({
            where: { name: roleData.name },
            update: {},
            create: roleData,
        });
    }

    console.log("✅ Roles creados.");

    // 2. Obtener el rol ADMIN
    const adminRole = await prisma.role.findUnique({
        where: { name: RoleName.ADMIN },
    });

    if (!adminRole) throw new Error("No se encontró el rol ADMIN.");

    // 3. Crear Usuario Administrador inicial
    const adminEmail = "admin@sistema.local";
    const passwordHash = await bcrypt.hash("Admin123!", 10);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: "Super Admin",
            email: adminEmail,
            passwordHash: passwordHash,
            roleId: adminRole.id,
            isActive: true,
        },
    });

    console.log(`✅ Usuario Admin creado: ${adminUser.email}`);
}

main()
    .catch((e) => {
        console.error("❌ Error en el seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
