-- CreateTable
CREATE TABLE "references" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "when" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "references_category_idx" ON "references"("category");
