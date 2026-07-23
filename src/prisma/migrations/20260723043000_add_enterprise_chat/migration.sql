CREATE TABLE IF NOT EXISTS "ChatMessages" (
  "id" TEXT PRIMARY KEY,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "recipientId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "body" TEXT,
  "attachmentUrl" TEXT,
  "attachmentType" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ChatMessages_senderId_recipientId_createdAt_idx" ON "ChatMessages"("senderId", "recipientId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessages_recipientId_readAt_idx" ON "ChatMessages"("recipientId", "readAt");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "chatLastSeenAt" TIMESTAMP(3);
