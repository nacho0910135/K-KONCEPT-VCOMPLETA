CREATE TABLE IF NOT EXISTS "Refund" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(65,30),
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REGISTERED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Refund_ticketId_idx" ON "Refund"("ticketId");
CREATE INDEX IF NOT EXISTS "Refund_requestedById_idx" ON "Refund"("requestedById");
CREATE INDEX IF NOT EXISTS "Refund_type_idx" ON "Refund"("type");
CREATE INDEX IF NOT EXISTS "Refund_status_idx" ON "Refund"("status");

ALTER TABLE "Refund"
ADD CONSTRAINT "Refund_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Refund"
ADD CONSTRAINT "Refund_requestedById_fkey"
FOREIGN KEY ("requestedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
