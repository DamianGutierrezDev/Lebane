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

  it('LP-13 el borrado masivo de todas las unidades elimina la lista', () => {
    const { bulk } = texts;

    // La 101 generada por el setup + dos unidades más del piso 1 (102 y 103)
    unitsPage.addNextUnit();
    unitsPage.addNextUnit();
    unitsPage.currentPriceList().then((list) => {
      cy.get('[data-table-id="units-table"] tbody td[data-column-id="numero"]')
        .then(($cells) => [...$cells].map((cell) => cell.innerText.trim()))
        .then((units) => {
          expect(units, 'unidades antes del borrado').to.have.length(3);
          const count = String(units.length);

          unitsPage.selectAllRows();
          unitsPage.rowsCounter().should('eq', bulk.selectedCount.replace(/\{count\}/g, count));

          unitsPage.requestBulkDelete();
          unitsPage.bulkDeleteDialog().within(() => {
            cy.contains(bulk.title).should('be.visible');
            // Con 3 unidades la app pregunta por "los elementos seleccionados". Con 4 se observó
            // "todos los elementos" más una advertencia: regla no confirmada (ver README)
            cy.contains(bulk.question.replace('{count}', count)).should('be.visible');
            units.forEach((unit) => {
              cy.contains(bulk.item.replace('{unit}', unit))
                .parent()
                .should('contain', bulk.itemFloor.replace('{floor}', '1'));
            });
            cy.contains('button', bulk.cancel).should('be.visible');
            cy.contains('button', bulk.confirm).should('be.visible');
          });

          unitsPage.confirmBulkDelete(bulk.success).should('be.visible');
          unitsPage.toast(bulk.toast).should('be.visible');
          unitsPage.closeBulkDeleteDialog();

          unitsPage.visit(projectId);
          unitsPage.emptyTableMessage(texts.withoutLists.emptyTable).should('be.visible');
          units.forEach((unit) => unitsPage.unitShouldNotExist(unit));
          unitsPage.primaryActionButton(texts.withoutLists.primaryAction).should('be.visible');
          unitsPage.priceListButtonLabel().should('eq', texts.withoutLists.priceListButton);
          unitsPage.openPriceListMenu().should('contain', texts.withoutLists.priceListMenu).and('not.contain', list);
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

describe('Quitar una unidad que está en dos listas de precios', () => {
  let projectId: number;
  let initialList: string;

  beforeEach(() => {
    initialList = `ListaInicial${Date.now()}`;
    cy.login();
    cy.prepareProject(buildSetup({ priceListName: initialList })).then((id) => {
      projectId = id;
      unitsPage.visit(projectId);
    });
  });

  it('LP-09 quitar de una lista una unidad que está en dos la mantiene en la otra', () => {
    // El template trae la 101 (se asocia a la unidad existente) y la 102, para que la lista nueva no quede vacía
    cy.buildUnitsTemplate([
      { name: AUTO_UNIT, price: 200000, floor: 1 },
      { name: '102', price: 100000, floor: 1 },
    ]).then((file) => unitsPage.uploadTemplate(file));
    unitsPage.closeTemplateReport();

    unitsPage.visit(projectId);
    unitsPage.currentPriceList().should('not.eq', initialList).then((templateList) => {
      unitsPage.row(AUTO_UNIT).should('be.visible');
      unitsPage.deleteUnit(AUTO_UNIT);

      unitsPage.visit(projectId);
      unitsPage.priceLists().should('include', initialList).and('include', templateList);
      unitsPage.selectPriceList(templateList);
      unitsPage.unitShouldNotExist(AUTO_UNIT);
      unitsPage.selectPriceList(initialList);
      unitsPage.row(AUTO_UNIT).should('be.visible');
    });
  });
});
