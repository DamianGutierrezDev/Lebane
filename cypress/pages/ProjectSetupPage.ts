import type { ProjectSetup } from '../factories/project.factory';

// Formulario "Actualizar datos del proyecto" que aparece al entrar a Unidades por primera vez
class ProjectSetupPage {
  private sel = {
    title: 'Actualizar datos del proyecto',
    pricePerM2: 'input[name="precioListaMetroCuadrado"]',
    floors: 'input[name="pisos"]',
    unitsPerFloor: 'input[name="unidadesPorPiso"]',
    typologies: '[data-cy="new-renderer-field-tipologias"]',
    priceListName: '[data-cy="new-renderer-field-versionListaPrecios"]',
    option: '[role="listbox"] [role="option"]',
    submit: 'form button[type="submit"]',
  };

  isVisible() {
    return cy.contains(this.sel.title).should('be.visible');
  }

  complete(setup: ProjectSetup) {
    this.isVisible();
    cy.get(this.sel.pricePerM2).type(String(setup.pricePerM2));
    cy.get(this.sel.floors).type(String(setup.floors));
    cy.get(this.sel.unitsPerFloor).type(String(setup.unitsPerFloor));
    cy.get(this.sel.typologies).click();
    cy.get(this.sel.option).should('have.length.greaterThan', 0).first().click();
    cy.get('body').type('{esc}');
    if (setup.priceListName) cy.get(this.sel.priceListName).type(setup.priceListName);
    cy.get(this.sel.submit).should('be.enabled').click();
  }
}

export const projectSetupPage = new ProjectSetupPage();
