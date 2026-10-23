import { defineConfig } from 'cypress';
import mochawesome from 'cypress-mochawesome-reporter/plugin';
import { buildUnitsTemplate } from './cypress/tasks/unitsTemplate';

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'Lebane - Listas de precios',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    baseUrl: 'https://tst.lebane.app',
    // La tabla de unidades es ancha: con un viewport chico la columna del tacho queda fuera de pantalla
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 15000,
    retries: { runMode: 1, openMode: 0 },
    video: false,
    setupNodeEvents(on, config) {
      mochawesome(on);
      on('task', { buildUnitsTemplate });
      return config;
    },
  },
});
