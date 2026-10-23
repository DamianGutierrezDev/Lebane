import { projectFormPage } from '../../pages/ProjectFormPage';
import { unitsPage } from '../../pages/UnitsPage';
import { buildProject, buildSetup, formatDate } from '../../factories/project.factory';

describe('Creación de proyecto y lista de precios inicial', () => {
  beforeEach(() => {
    cy.login();
  });

  it('LP-01 crea la lista de precios inicial con el nombre indicado', () => {
    const priceListName = `Lista QA ${Date.now()}`;

    cy.prepareProject(buildSetup({ priceListName })).then((projectId) => {
      unitsPage.visit(projectId);
      unitsPage.currentPriceList().should('eq', priceListName);
      unitsPage.priceLists().should('deep.equal', [priceListName]);
    });
  });

  it('LP-02 crea la lista de precios inicial con nombre por defecto si no se especifica', () => {
    cy.prepareProject().then((projectId) => {
      unitsPage.visit(projectId);
      // Formato observado en la Fig. 6 del enunciado: "Lista precios 20/11/2025"
      unitsPage.currentPriceList().should('eq', `Lista precios ${formatDate(new Date())}`);
      unitsPage.priceLists().should('have.length', 1);
    });
  });

  it('LP-10 no permite registrar el proyecto sin los campos obligatorios', () => {
    projectFormPage.open();

    projectFormPage.submitButton().should('be.disabled');
  });

  it('LP-12 no permite registrar el proyecto con un nombre compuesto solo por espacios', () => {
    projectFormPage.open();
    projectFormPage.fill(buildProject({ name: '   ' }));

    projectFormPage.submitButton().should('be.disabled');
  });
});
