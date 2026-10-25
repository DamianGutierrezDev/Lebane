import { unitsPage } from '../../pages/UnitsPage';
import { AUTO_UNIT, buildSetup } from '../../factories/project.factory';
import texts from '../../fixtures/delete-unit.json';

describe('Quitar la única unidad de una lista de precios', () => {
  let projectId: number;
  let listName: string;

  beforeEach(() => {
    listName = `ListaAEliminar${Date.now()}`;
    cy.login();
    // El setup genera la unidad 101 como única unidad de la lista
    cy.prepareProject(buildSetup({ priceListName: listName })).then((id) => {
      projectId = id;
      unitsPage.visit(projectId);
    });
  });

  it('LP-07 quitar la única unidad de una lista elimina la lista', () => {
    unitsPage.currentPriceList().should('eq', listName);
    unitsPage.rowCount().should('eq', 1);

    unitsPage.requestDelete(AUTO_UNIT);

    unitsPage.deleteDialogTitle().should('contain', texts.dialog.title);
    unitsPage.deleteDialogBody().should((body) => {
      expect(body).to.contain(texts.dialog.question.replace('{unit}', AUTO_UNIT).replace('{list}', listName));
      expect(body).to.contain(texts.dialog.emptyListWarning);
      expect(body).to.contain(texts.dialog.orphanUnitWarning);
    });
    unitsPage.deleteDialogButton(texts.dialog.confirm).should('be.visible');
    unitsPage.deleteDialogCloseButton().should('be.visible');

    unitsPage.confirmDelete();
    unitsPage.toast(texts.deletedToast).should('be.visible');

    unitsPage.visit(projectId);
    unitsPage.emptyTableMessage(texts.withoutLists.emptyTable).should('be.visible');
    unitsPage.unitShouldNotExist(AUTO_UNIT);
    unitsPage.primaryActionButton(texts.withoutLists.primaryAction).should('be.visible');
    unitsPage.priceListButtonLabel().should('eq', texts.withoutLists.priceListButton);
    unitsPage.openPriceListMenu().should('contain', texts.withoutLists.priceListMenu).and('not.contain', listName);
  });
});

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
    unitsPage.addNextUnit().then((unit) => {
      unitsPage.currentPriceList().then((list) => {
        unitsPage.deleteUnit(unit);

        unitsPage.row(AUTO_UNIT).should('be.visible');
        unitsPage.visit(projectId);
        unitsPage.priceLists().should('include', list);
      });
    });
  });

  it('LP-08 una unidad que queda sin lista de precios se elimina', () => {
    unitsPage.addNextUnit().then((unit) => {
      unitsPage.deleteUnit(unit);

      unitsPage.visit(projectId);
      unitsPage.priceLists().then((lists) => {
        lists.forEach((list) => {
          unitsPage.selectPriceList(list);
          unitsPage.unitShouldNotExist(unit);
        });
      });
    });
  });
});
