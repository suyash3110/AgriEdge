ALTER TABLE "Lot" ADD COLUMN "gradeMethod" TEXT NOT NULL DEFAULT 'farmer_declared';
ALTER TABLE "Lot" ADD COLUMN "imageAssessmentId" TEXT;
CREATE UNIQUE INDEX "Lot_imageAssessmentId_key" ON "Lot"("imageAssessmentId");
CREATE TABLE "ImageAssessment" (
 "id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "crop" TEXT NOT NULL, "category" TEXT NOT NULL DEFAULT 'produce',
 "grade" TEXT, "label" TEXT, "modelHash" TEXT, "imageHash" TEXT NOT NULL,
 "mime" TEXT NOT NULL, "image" BYTEA NOT NULL, "lotId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ImageAssessment_lotId_key" ON "ImageAssessment"("lotId");
CREATE INDEX "ImageAssessment_ownerId_createdAt_idx" ON "ImageAssessment"("ownerId", "createdAt");
