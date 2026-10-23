import { unitsPage } from '../../pages/UnitsPage';
import { AUTO_UNIT, buildUnitName } from '../../factories/project.factory';

describe('Quitar unidades de una lista de precios', () => {
  let projectId: number;

  beforeEach(() => {
    cy.login();
    cy.prepareProject().then((id) => {
      projectId = id;
      unitsPage.visit(projectId);
    });
  });

  it('LP-06 quitar una unidad de una lista con varias unidades mantiene la lista', () => {
    const unit = buildUnitName();
    unitsPage.addUnit(unit);

    unitsPage.currentPriceList().then((list) => {
      unitsPage.deleteUnit(unit);

      unitsPage.row(AUTO_UNIT).should('be.visible');
      unitsPage.visit(projectId);
      unitsPage.priceLists().should('include', list);
    });
  });

  it('LP-07 quitar la única unidad de una lista elimina la lista', () => {
    unitsPage.currentPriceList().then((list) => {
      unitsPage
        .requestDelete(AUTO_UNIT)
        .should('contain', 'la lista de precios quedará vacia y será eliminada');
      unitsPage.confirmDelete();

      unitsPage.visit(projectId);
      unitsPage.unitShouldNotExist(AUTO_UNIT);
      cy.contains('button', 'Adicionar unidad').closest('.MuiPaper-root').should('not.contain', list);
    });
  });

  it('LP-08 una unidad que queda sin lista de precios se elimina', () => {
    const unit = buildUnitName();
    unitsPage.addUnit(unit);

    unitsPage.deleteUnit(unit);

    unitsPage.visit(projectId);
    unitsPage.priceLists().then((lists) => {
      lists.forEach((list) => {
        unitsPage.selectPriceList(list);
        unitsPage.unitShouldNotExist(unit);
      });
    });
  });

  // Supuesto a validar con negocio: una unidad del template con el mismo número que una existente
  // se asocia a esa unidad (queda en ambas listas) en lugar de crear una nueva.
  it('LP-09 una unidad presente en dos listas sigue existiendo al quitarla de una', () => {
    unitsPage.currentPriceList().then((initialList) => {
      cy.buildUnitsTemplate([{ name: AUTO_UNIT, price: 200000 }]).then((file) => unitsPage.uploadTemplate(file));
      unitsPage.closeTemplateReport();

      unitsPage.visit(projectId);
      unitsPage.priceLists().then((lists) => {
        const templateList = lists.find((name) => name !== initialList)!;
        unitsPage.selectPriceList(templateList);
        unitsPage.deleteUnit(AUTO_UNIT);
      });

      unitsPage.visit(projectId);
      unitsPage.selectPriceList(initialList);
      unitsPage.row(AUTO_UNIT).should('be.visible');
    });
  });
});
