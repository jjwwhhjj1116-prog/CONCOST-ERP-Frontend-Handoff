CREATE TABLE "InputSuggestion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "displayValue" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'COMPANY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InputSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InputSuggestionUse" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InputSuggestionUse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InputSuggestion_companyId_moduleKey_fieldKey_normalizedValue_key"
ON "InputSuggestion"("companyId", "moduleKey", "fieldKey", "normalizedValue");

CREATE INDEX "InputSuggestion_companyId_moduleKey_fieldKey_lastUsedAt_idx"
ON "InputSuggestion"("companyId", "moduleKey", "fieldKey", "lastUsedAt");

CREATE INDEX "InputSuggestion_companyId_isActive_updatedAt_idx"
ON "InputSuggestion"("companyId", "isActive", "updatedAt");

CREATE UNIQUE INDEX "InputSuggestionUse_suggestionId_userId_key"
ON "InputSuggestionUse"("suggestionId", "userId");

CREATE INDEX "InputSuggestionUse_userId_lastUsedAt_idx"
ON "InputSuggestionUse"("userId", "lastUsedAt");

ALTER TABLE "InputSuggestionUse"
ADD CONSTRAINT "InputSuggestionUse_suggestionId_fkey"
FOREIGN KEY ("suggestionId") REFERENCES "InputSuggestion"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
