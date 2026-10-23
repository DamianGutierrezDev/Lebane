const TABLE = '[data-table-id="units-table"]';

class UnitsPage {
  private sel = {
    table: TABLE,
    rows: `${TABLE} tbody tr`,
    unitCell: `${TABLE} tbody td[data-column-id="numero"]`,
    deleteButton: 'td[data-column-id="menu"] button',
    priceListItem: '[role="menu"] div.cursor-pointer',
    menuButton: '[role="menu"] button',
    dialog: '[role="dialog"]',
    errorToast: '.Toastify__toast--error',
  };

  visit(projectId: number) {
    cy.intercept('GET', `**/v2/proyectos/${projectId}/unidades?*`).as('getUnits');
    cy.visit(`/proyecto/${projectId}/areas`);
    cy.contains('[role="tab"]', 'Unidades').click();
    cy.wait('@getUnits');
    cy.get(this.sel.table).should('be.visible');
  }

  row(unit: string) {
    return cy.contains(this.sel.unitCell, new RegExp(`^${Cypress._.escapeRegExp(unit)}$`)).closest('tr');
  }

  unitShouldNotExist(unit: string) {
    cy.get(this.sel.table).should('be.visible');
    cy.contains(this.sel.unitCell, new RegExp(`^${Cypress._.escapeRegExp(unit)}$`)).should('not.exist');
  }

  rowCount() {
    return cy
      .contains(`${TABLE} span`, /^\d+ filas?$/)
      .invoke('text')
      .then((text) => parseInt(text, 10));
  }

  /** "Adicionar unidad" agrega una fila vacía al final; se nombra editando la celda inline. */
  addUnit(unit: string) {
    cy.get(this.sel.rows).its('length').then((before) => {
      cy.contains('button', 'Adicionar unidad').click();
      cy.get(this.sel.rows).should('have.length', before + 1);
    });
    this.editCell(cy.get(this.sel.rows).last(), 'numero', unit);
    this.row(unit).should('be.visible');
  }

  setPrice(unit: string, price: number) {
    this.editCell(this.row(unit), 'precio', String(price));
  }

  price(unit: string) {
    return this.row(unit).find('td[data-column-id="precio"]').invoke('text');
  }

  requestDelete(unit: string) {
    this.row(unit).find(this.sel.deleteButton).click();
    return cy.contains(this.sel.dialog, 'Eliminar unidad');
  }

  confirmDelete() {
    cy.get(this.sel.dialog).contains('button', 'Confirmar').click();
    cy.get(this.sel.dialog).should('not.exist');
  }

  deleteUnit(unit: string) {
    this.requestDelete(unit);
    this.confirmDelete();
    this.unitShouldNotExist(unit);
  }

  private editCell(row: Cypress.Chainable<JQuery<HTMLTableRowElement>>, column: string, value: string) {
    row.find(`td[data-column-id="${column}"]`).click();
    cy.focused().should('have.attr', 'placeholder', 'Valor...').clear().type(`${value}{enter}`);
  }

  // --- Listas de precios ---

  private priceListButton() {
    return cy.contains('button', 'Adicionar unidad').closest('.MuiPaper-root').find('button').first();
  }

  currentPriceList() {
    return this.priceListButton().invoke('text').then((text) => text.trim());
  }

  priceLists() {
    this.priceListButton().click();
    return cy
      .get(this.sel.priceListItem)
      .then(($items) => [...$items].map((item) => item.innerText.trim()))
      .then((names) => {
        cy.get('body').type('{esc}');
        cy.get('[role="menu"]').should('not.exist');
        return cy.wrap(names);
      });
  }

  selectPriceList(name: string) {
    this.priceListButton().click();
    cy.contains(this.sel.priceListItem, name).click();
    this.currentPriceList().should('eq', name);
  }

  // --- Templates ---

  uploadTemplate(filePath: string) {
    cy.contains('button', 'Templates').click();
    cy.contains(this.sel.menuButton, 'Cargar Template de Unidades').click();
    cy.contains(this.sel.dialog, 'Cargar Template de Unidades').within(() => {
      cy.get('input[type="file"]').selectFile(filePath, { force: true });
      cy.contains('button', /^Cargar$/).click();
    });
  }

  /** Tras una carga procesada la app ofrece descargar un reporte de validación. */
  closeTemplateReport() {
    cy.contains(this.sel.dialog, 'Descarga de reporte de template').contains('button', 'Cerrar').click();
    cy.get(this.sel.dialog).should('not.exist');
  }

  errorToast() {
    return cy.get(this.sel.errorToast);
  }
}

export const unitsPage = new UnitsPage();
