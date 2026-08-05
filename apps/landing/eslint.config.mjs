import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * Почему FlatCompat, а не `eslint-config-next/core-web-vitals` как в
 * web-buyer/web-seller: там Next 16, у которого eslint-config-next отдаёт
 * flat-конфиги отдельными subpath-экспортами. Здесь Next 15 — у его
 * eslint-config-next нет поля `exports`, только eslintrc-формат, поэтому
 * его надо переложить в flat через FlatCompat.
 *
 * Без конфига `next lint` уходил в интерактивный визард настройки и валил
 * корневой `turbo lint` за 1.1 с — до того, как отработают api / web-buyer /
 * web-seller, из-за чего их результаты никто не видел (issue #13).
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
