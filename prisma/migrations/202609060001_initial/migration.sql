-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "fpoId" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "village" TEXT NOT NULL DEFAULT 'Rewa',
    "language" TEXT NOT NULL DEFAULT 'en',
    "crops" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "subjectId" TEXT,
    "hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fpoId" TEXT,
    "title" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'produce',
    "material" TEXT,
    "form" TEXT,
    "intendedUse" TEXT,
    "contamination" TEXT,
    "kg" DECIMAL(18,3) NOT NULL,
    "reservedKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "expectedRate" BIGINT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT 'Farmer declared',
    "location" TEXT NOT NULL DEFAULT 'Rewa',
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "availableDate" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "circleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "rate" BIGINT NOT NULL,
    "costPaise" BIGINT,
    "payer" TEXT NOT NULL,
    "arranger" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "kg" DECIMAL(18,3) NOT NULL,
    "rate" BIGINT NOT NULL,
    "totalPaise" BIGINT NOT NULL,
    "costPaise" BIGINT,
    "payer" TEXT NOT NULL,
    "arranger" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "fulfilment" TEXT NOT NULL DEFAULT 'accepted',
    "payment" TEXT NOT NULL DEFAULT 'unpaid',
    "settlement" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demand" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'produce',
    "kg" DECIMAL(18,3) NOT NULL,
    "grade" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "terms" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circle" (
    "id" TEXT NOT NULL,
    "fpoId" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "targetKg" DECIMAL(18,3) NOT NULL,
    "minimumKg" DECIMAL(18,3) NOT NULL,
    "hub" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'forming',
    "allocationRule" TEXT NOT NULL DEFAULT 'Proportional to accepted weight; no undisclosed deductions',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "pledgedKg" DECIMAL(18,3) NOT NULL,
    "receivedKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "acceptedKg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "grade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pledged',
    "consent" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quality" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "fpoId" TEXT NOT NULL,
    "assessorId" TEXT,
    "grade" TEXT,
    "measurements" TEXT,
    "reason" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'manual_requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "fpoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "crops" TEXT[],
    "type" TEXT NOT NULL,
    "capacityKg" DECIMAL(18,3) NOT NULL,
    "ratePaise" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "kg" DECIMAL(18,3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "fpoId" TEXT NOT NULL,
    "deltaKg" DECIMAL(18,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacityKg" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportJob" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "transporterId" TEXT,
    "vehicleId" TEXT,
    "quotePaise" BIGINT,
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "kg" DECIMAL(18,3) NOT NULL,
    "payer" TEXT NOT NULL,
    "arranger" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "terms" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPing" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationPing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "mode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'allocated',

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "memberIds" TEXT[],
    "blockedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contextId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "issuerRole" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idempotency" (
    "id" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "accepted" INTEGER NOT NULL,
    "rejected" INTEGER NOT NULL,
    "errors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceObservation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "observedDate" TIMESTAMP(3) NOT NULL,
    "unit" TEXT NOT NULL,
    "minPaise" BIGINT NOT NULL,
    "modalPaise" BIGINT NOT NULL,
    "maxPaise" BIGINT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PriceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Challenge_phone_purpose_idx" ON "Challenge"("phone", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_circleId_key" ON "Lot"("circleId");

-- CreateIndex
CREATE INDEX "Bid_lotId_status_idx" ON "Bid"("lotId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_lotId_key" ON "Agreement"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_bidId_key" ON "Agreement"("bidId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_circleId_lotId_key" ON "Contribution"("circleId", "lotId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registration_key" ON "Vehicle"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "TransportJob_agreementId_key" ON "TransportJob"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_jobId_transporterId_key" ON "Quote"("jobId", "transporterId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_agreementId_key" ON "PaymentOrder"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_providerRef_key" ON "PaymentOrder"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_eventId_account_key" ON "LedgerEntry"("eventId", "account");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_agreementId_farmerId_key" ON "Allocation"("agreementId", "farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_checksum_key" ON "ImportBatch"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "PriceObservation_key_key" ON "PriceObservation"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_key_key" ON "Attachment"("key");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
