import { defineConfig } from 'cypress'
import { execFileSync } from 'node:child_process'

export default defineConfig({
  taskTimeout: 180000,
  e2e: {
    baseUrl: 'http://localhost:8000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    setupNodeEvents(on) {
      on('task', {
        resetDatabase() {
          execFileSync('docker', ['compose', 'exec', '-T', 'app', 'php', 'artisan', 'migrate:fresh', '--seed', '--force'], { stdio: 'pipe' })
          return null
        },
        runPhpUnit() {
          return execFileSync('php', ['artisan', 'test'], { encoding: 'utf8' })
        },
      })
    },
  },
})
