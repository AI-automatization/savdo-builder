-- TG-BOT-SELLER-TERMS-001: продавец обязан принять условия использования платформы
-- перед созданием магазина. Nullable — старые продавцы, зарегистрированные до
-- этого шага, остаются с termsAcceptedAt=NULL (историю не подделываем).
-- ADD-ONLY: данные не трогаем.
ALTER TABLE "sellers" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
