// @ts-check
const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    ...js.configs.recommended,
    files: ['src/**/*.js'],
  },
];
