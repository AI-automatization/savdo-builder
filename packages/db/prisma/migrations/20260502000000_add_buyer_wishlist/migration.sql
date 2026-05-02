-- CreateTable
CREATE TABLE "buyer_wishlist_items" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyer_wishlist_items_buyerId_productId_key" ON "buyer_wishlist_items"("buyerId", "productId");

-- CreateIndex
CREATE INDEX "buyer_wishlist_items_buyerId_idx" ON "buyer_wishlist_items"("buyerId");

-- CreateIndex
CREATE INDEX "buyer_wishlist_items_productId_idx" ON "buyer_wishlist_items"("productId");

-- AddForeignKey
ALTER TABLE "buyer_wishlist_items" ADD CONSTRAINT "buyer_wishlist_items_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_wishlist_items" ADD CONSTRAINT "buyer_wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
