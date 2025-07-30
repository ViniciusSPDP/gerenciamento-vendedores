// prisma/seed.ts

// Usando require em vez de import para compatibilidade
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const saltRounds = 10;

const vendedores = [
    "999", "DJALMA", "ROLOPES", "LOURDES", "T_ERICA", "ADMSUELI",
    "RO_AGREG", "HENRI_CC", "WALNER_F", "T_GILTON", "SUPMARCO", "T_FERN",
    "CARECA", "MARCIAAZ", "NATAN", "HELEN_AL", "PRI_SILV", "P_TRAINA",
    "RDACANAL", "MAURICIO", "MIGUELDO", "JAQUE", "GISLEI", "SUELI",
    "NIVALDO", "TATI_PS", "MORGANA", "FAB_CVIG", "YGOR_SAN", "SILVANA",
    "MARYANNE", "ALESSAND", "LUIS_FA", "RITA_HAD", "JP_REZEN", "P_MORAES",
    "LEAO_AM", "EUGENIA", "ARIANE_M", "FRAN_SIL", "GENIZELI", "J_AMANDA",
    "CUSTODIA", "DFF_BR", "DFF_SP", "ANT_INNO", "DFF_MA", "DFF_FI"
];

async function main() {
    console.log('Start seeding...');

    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    for (const nomeVendedor of vendedores) {
        const password = await bcrypt.hash('vendedor123', saltRounds); // Senha padrão para todos
        await prisma.user.upsert({
            where: { username: nomeVendedor },
            update: {},
            create: {
                username: nomeVendedor,
                password: password,
                role: 'VENDEDOR',
            },
        });
    }
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });