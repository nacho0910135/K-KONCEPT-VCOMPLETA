const { prisma } = require('../config/database');

let tableReady = false;

const ensureTable = async () => {
  if (tableReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppSettings" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  tableReady = true;
};

const appSettingRepository = {
  async get(key) {
    await ensureTable();
    const rows = await prisma.$queryRaw`
      SELECT "value" FROM "AppSettings" WHERE "key" = ${key} LIMIT 1
    `;

    return rows[0]?.value ?? null;
  },

  async set(key, value) {
    await ensureTable();
    const rows = await prisma.$queryRaw`
      INSERT INTO "AppSettings" ("key", "value", "updatedAt")
      VALUES (${key}, ${String(value)}, NOW())
      ON CONFLICT ("key")
      DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
      RETURNING "key", "value", "createdAt", "updatedAt"
    `;

    return rows[0];
  }
};

module.exports = { appSettingRepository };
