-- Add read-tracking timestamps to chat_threads
ALTER TABLE "chat_threads"
  ADD COLUMN "buyerLastReadAt"  TIMESTAMP(3),
  ADD COLUMN "sellerLastReadAt" TIMESTAMP(3);
