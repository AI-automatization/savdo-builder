-- Chat message: edit + soft-delete timestamps
ALTER TABLE "chat_messages"
  ADD COLUMN "editedAt"  TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Chat thread: per-participant soft-delete
ALTER TABLE "chat_threads"
  ADD COLUMN "buyerDeletedAt"  TIMESTAMP(3),
  ADD COLUMN "sellerDeletedAt" TIMESTAMP(3);

-- Seller: avatar url
ALTER TABLE "sellers"
  ADD COLUMN "avatarUrl" TEXT;
