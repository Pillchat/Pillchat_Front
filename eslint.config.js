import js from "@eslint/js";
import next from "@next/eslint-plugin-next";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@next/next": next,
    },
    rules: {
      semi: ["error", "always"], // 세미콜론 강제
      quotes: ["error", "double"], // 큰따옴표 사용 강제
      "no-unused-vars": "warn", // 사용되지 않는 변수 경고
    },
  },
];
