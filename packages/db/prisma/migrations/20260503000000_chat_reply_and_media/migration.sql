-- Add reply and media support to chat messages
ALTER TABLE "chat_messages"
  ADD COLUMN "parentMessageId" TEXT,
  ADD COLUMN "mediaId"         TEXT;

-- Self-reference for reply chains (SET NULL on delete preserves orphan messages)
ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_parentMessageId_fkey"
  FOREIGN KEY ("parentMessageId") REFERENCES "chat_messages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Photo attachment via existing media_files table
ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "media_files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "chat_messages_parentMessageId_idx" ON "chat_messages"("parentMessageId");
CREATE INDEX "chat_messages_mediaId_idx"         ON "chat_messages"("mediaId");
