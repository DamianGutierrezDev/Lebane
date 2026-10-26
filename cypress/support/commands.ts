import { loginPage } from '../pages/LoginPage';
import { homePage } from '../pages/HomePage';
import { projectFormPage } from '../pages/ProjectFormPage';
import { projectSetupPage } from '../pages/ProjectSetupPage';
import { buildProject, buildSetup, type ProjectData, type ProjectSetup } from '../factories/project.factory';
import type { TemplateUnit } from '../tasks/unitsTemplate';
import type { Credentials } from './index';

Cypress.Commands.add('credentials', () => {
  return cy.env<Credentials>(['USER_EMAIL', 'USER_PASSWORD'], { log: false }).then((env) => {
    if (!env.USER_EMAIL || !env.USER_PASSWORD) {
      throw new Error('Faltan USER_EMAIL / USER_PASSWORD (ver cypress.env.example.json)');
    }
    return env;
  });
});

Cypress.Commands.add('login', () => {
  cy.credentials().then(({ USER_EMAIL: email, USER_PASSWORD: password }) => {
    cy.session(
      email,
      () => {
        loginPage.visit();
        loginPage.login(email, password);
        cy.location('pathname').should('not.include', '/sign-in');
      },
      {
        validate: () => homePage.visit(),
        cacheAcrossSpecs: true,
      },
    );
  });
});

// Al cerrar el navegador se pierden sessionStorage y las cookies sin vencimiento; localStorage persiste
Cypress.Commands.add('simulateBrowserRestart', () => {
  cy.window().then((win) => win.sessionStorage.clear());
  cy.getAllCookies().then((cookies) =>
    cookies.filter((cookie) => !cookie.expiry).forEach((cookie) => cy.clearCookie(cookie.name, { domain: cookie.domain })),
  );
  cy.visit('/');
});

Cypress.Commands.add('createProject',(project: ProjectData) => {
  projectFormPage.open();
  if (project.logo) projectFormPage.uploadLogo(project.logo);
  projectFormPage.fill(project);
  // El logo se sube después de crear el proyecto, con PATCH /proyect/{id}/update-logo
  cy.intercept('PATCH', '**/proyect/*/update-logo').as('updateLogo');
  projectFormPage.submit();
  cy.contains('.Toastify__toast', 'Creación exitosa').should('be.visible');
  if (project.logo) {
    const fileName = project.logo.split('/').pop()!;
    cy.wait('@updateLogo').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.logo).to.match(new RegExp(`/${Cypress._.escapeRegExp(fileName)}$`));
    });
  }

  // El id sale de los links del sidebar, que pasan de /proyecto/:id/ a /proyecto/<id>/ al entrar al proyecto
  return cy
    .get('a[href*="/proyecto/"]', { timeout: 30000 })
    .first()
    .should('have.attr', 'href')
    .and('match', /\/proyecto\/\d+\//)
    .then((href) => Number(String(href).match(/\/proyecto\/(\d+)\//)![1]));
});

Cypress.Commands.add('setupProject', (projectId: number, setup: ProjectSetup) => {
  cy.visit(`/proyecto/${projectId}/areas`);
  projectSetupPage.complete(setup);
  cy.contains('[role="tab"]', 'Unidades').should('be.visible');
});

Cypress.Commands.add('prepareProject', (setup: ProjectSetup = buildSetup()) => {
  return cy.createProject(buildProject()).then((projectId) => {
    cy.setupProject(projectId, setup);
    return cy.wrap(projectId);
  });
});

Cypress.Commands.add('buildUnitsTemplate', (units: TemplateUnit[]) => {
  return cy.task<string>('buildUnitsTemplate', units);
});
