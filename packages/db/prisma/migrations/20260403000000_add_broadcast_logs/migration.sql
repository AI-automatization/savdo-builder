-- CreateTable
CREATE TABLE "broadcast_logs" (
    "id"          TEXT NOT NULL,
    "message"     TEXT NOT NULL,
    "sentCount"   INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcast_logs_createdAt_idx" ON "broadcast_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "broadcast_logs" ADD CONSTRAINT "broadcast_logs_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
