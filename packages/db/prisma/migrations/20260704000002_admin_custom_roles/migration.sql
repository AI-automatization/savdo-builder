-- FEAT-CUSTOM-ROLES-001: кастомные admin-роли (управляются super_admin из панели).
-- Additive: новая таблица, ничего не удаляет/переименовывает → prod-safe.
CREATE TABLE "admin_custom_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_custom_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_custom_roles_name_key" ON "admin_custom_roles"("name");
