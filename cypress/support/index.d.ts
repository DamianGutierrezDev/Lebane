import type { ProjectData, ProjectSetup } from '../factories/project.factory';
import type { TemplateUnit } from '../tasks/unitsTemplate';

export interface Credentials {
  USER_EMAIL: string;
  USER_PASSWORD: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      /** Lee USER_EMAIL / USER_PASSWORD con cy.env (cypress.env.json o variables CYPRESS_*). */
      credentials(): Chainable<Credentials>;
      /** Login por UI cacheado con cy.session. */
      login(): Chainable<void>;
      /** Simula cerrar y reabrir el navegador (borra sessionStorage y cookies de sesión) y vuelve al home. */
      simulateBrowserRestart(): Chainable<void>;
      /** Crea un proyecto por UI y devuelve su id. */
      createProject(project: ProjectData): Chainable<number>;
      /** Completa "Actualizar datos del proyecto" (donde se nombra la lista de precios inicial). */
      setupProject(projectId: number, setup: ProjectSetup): Chainable<void>;
      /** Crea un proyecto y lo deja listo para operar unidades. Devuelve su id. */
      prepareProject(setup?: ProjectSetup): Chainable<number>;
      /** Genera un .xlsx a partir del template oficial con las unidades indicadas. Devuelve su ruta. */
      buildUnitsTemplate(units: TemplateUnit[]): Chainable<string>;
    }
  }
}
