import 'cypress-mochawesome-reporter/register';
import './commands';

// Intercom y Hotjar cargan scripts de terceros que a veces lanzan errores ajenos a la app
Cypress.on('uncaught:exception', (err) => {
  if (/intercom|hotjar|ResizeObserver/i.test(err.message)) return false;
});
