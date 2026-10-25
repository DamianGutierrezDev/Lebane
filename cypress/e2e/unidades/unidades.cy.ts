import { unitsPage } from '../../pages/UnitsPage';

describe('Unidades manuales', () => {
  let projectId: number;

  before(() => {
    cy.login();
    cy.prepareProject().then((id) => {
      projectId = id;
    });
  });

  beforeEach(() => {
    cy.login();
    unitsPage.visit(projectId);
  });

  it('LP-03 crea una unidad manualmente en la lista de precios actual', () => {
    unitsPage.rowCount().then((before) => {
      unitsPage.addNextUnit().then((unit) => {
        unitsPage.rowCount().should('eq', before + 1);

        unitsPage.visit(projectId);
        unitsPage.row(unit).should('be.visible').find('td[data-column-id="piso"]').should('contain', 'Piso 1');
      });
    });
  });

  it('LP-04 modificar el precio de una unidad actualiza la misma lista de precios', () => {
    unitsPage.addNextUnit().then((unit) => {
      unitsPage.currentPriceList().then((listBefore) => {
        unitsPage.priceLists().then((listsBefore) => {
          unitsPage.setPrice(unit, 150000);

          unitsPage.price(unit).should('contain', '150.000');
          unitsPage.currentPriceList().should('eq', listBefore);
          unitsPage.priceLists().should('deep.equal', listsBefore);
        });
      });

      unitsPage.visit(projectId);
      unitsPage.price(unit).should('contain', '150.000');
    });
  });
});
