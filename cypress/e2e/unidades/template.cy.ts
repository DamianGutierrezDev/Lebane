import { unitsPage } from '../../pages/UnitsPage';

describe('Carga de unidades por template', () => {
  let projectId: number;

  beforeEach(() => {
    cy.login();
    cy.prepareProject().then((id) => {
      projectId = id;
      unitsPage.visit(projectId);
    });
  });

  // Hoy falla: la app agrega las unidades a la lista existente en vez de crear una nueva (bug KAN-12)
  it('LP-05 cargar un template crea una nueva lista de precios con sus unidades', () => {
    // Próximos deptos del piso 1 (102 y 103, ya que el setup genera la 101)
    unitsPage.nextUnitNames(2).then((units) => {
      cy.buildUnitsTemplate(units.map((name) => ({ name, price: 100000, floor: 1 }))).then((file) => {
        unitsPage.priceLists().then((listsBefore) => {
          unitsPage.uploadTemplate(file);
          unitsPage.closeTemplateReport();

          unitsPage.visit(projectId);
          unitsPage.priceLists().should('have.length', listsBefore.length + 1);
        });
      });

      unitsPage.priceLists().then((lists) => unitsPage.selectPriceList(lists[lists.length - 1]));
      units.forEach((unit) => unitsPage.row(unit).should('be.visible'));
    });
  });

  it('LP-11 un archivo con formato inválido no crea una lista de precios', () => {
    unitsPage.priceLists().then((listsBefore) => {
      unitsPage.uploadTemplate('cypress/fixtures/templates/invalido.csv');

      unitsPage.errorToast().should('be.visible');
      unitsPage.visit(projectId);
      unitsPage.priceLists().should('deep.equal', listsBefore);
    });
  });
});
