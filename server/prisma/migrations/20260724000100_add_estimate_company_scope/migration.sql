ALTER TABLE "EstimateRequest"
ADD COLUMN "companyId" TEXT;

ALTER TABLE "CommercialDecision"
ADD COLUMN "companyId" TEXT;

CREATE INDEX "EstimateRequest_companyId_status_updatedAt_idx"
ON "EstimateRequest"("companyId", "status", "updatedAt");

CREATE INDEX "CommercialDecision_companyId_decidedAt_idx"
ON "CommercialDecision"("companyId", "decidedAt");
