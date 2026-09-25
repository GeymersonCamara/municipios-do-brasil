-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primeStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primeCurrentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "User_primeStatus_idx" ON "User"("primeStatus");
