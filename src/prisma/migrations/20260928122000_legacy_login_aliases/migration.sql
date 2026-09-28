ALTER TABLE "User" ADD COLUMN "loginAlias" TEXT;
CREATE UNIQUE INDEX "User_loginAlias_key" ON "User"("loginAlias");
UPDATE "User" SET "loginAlias" = 'admin@kollabkoncepts.com' WHERE "email" = '1josemendezporras@gmail.com' AND "role" = 'ADMIN';
UPDATE "User" SET "loginAlias" = 'tecnico@kollabkoncepts.com' WHERE "email" = '2josemendezporras@gmail.com' AND "role" = 'TECHNICIAN';
UPDATE "User" SET "loginAlias" = 'cliente@kollabkoncepts.com' WHERE "email" = '3josemendezporras@gmail.com' AND "role" = 'CLIENT';
