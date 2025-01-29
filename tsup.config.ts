import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/test/**/*.ts'],
  format: 'esm',
  clean: true,
  outDir: 'dist',
})
