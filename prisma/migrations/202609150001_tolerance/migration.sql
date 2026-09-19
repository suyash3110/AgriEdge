ALTER TABLE "Agreement" ADD COLUMN "tolerancePaise" BIGINT NOT NULL DEFAULT 0;
CREATE TABLE "ToleranceProposal" (
 "id" TEXT PRIMARY KEY, "agreementId" TEXT NOT NULL, "proposerId" TEXT NOT NULL,
 "amountPaise" BIGINT NOT NULL CHECK ("amountPaise" >= 0), "reason" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'pending', "decidedBy" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ToleranceProposal_agreementId_status_idx" ON "ToleranceProposal"("agreementId", "status");
