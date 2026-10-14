-- AlterTable
ALTER TABLE "VisitedMunicipality" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "VisitComment" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitComment_visitId_createdAt_idx" ON "VisitComment"("visitId", "createdAt");
CREATE INDEX "VisitComment_parentId_idx" ON "VisitComment"("parentId");
CREATE INDEX "VisitComment_userId_idx" ON "VisitComment"("userId");

-- AddForeignKey
ALTER TABLE "VisitComment" ADD CONSTRAINT "VisitComment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "VisitedMunicipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitComment" ADD CONSTRAINT "VisitComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitComment" ADD CONSTRAINT "VisitComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "VisitComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
