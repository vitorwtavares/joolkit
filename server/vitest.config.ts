import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    // Every route test spins up an ephemeral supertest server; running the
    // files in parallel occasionally collided at the socket level and surfaced
    // as a flaky "socket hang up" (ECONNRESET). The suite is tiny (~1.7s), so
    // serialising the files trades a little wall-clock for deterministic runs.
    fileParallelism: false,
  },
})
