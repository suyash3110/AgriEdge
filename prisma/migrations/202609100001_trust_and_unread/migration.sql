ALTER TABLE "User" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);
CREATE TABLE "TrustEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TrustEvent_userId_createdAt_idx" ON "TrustEvent"("userId", "createdAt");
