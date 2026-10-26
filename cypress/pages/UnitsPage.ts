import { buildUnitName } from '../factories/project.factory';

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

  /**
   * Cantidad de unidades pintadas en la tabla. Se cuentan las celdas y no el texto "N filas":
   * el contador muestra "0 filas" un instante después de que llega la respuesta de la API.
   */
  rowCount() {
    return cy.get(this.sel.unitCell).should('have.length.greaterThan', 0).its('length');
  }

  /**
   * "Adicionar unidad" agrega una fila vacía y abre sola la edición del número.
   * La unidad recién existe en el backend cuando responde POST /unidad: hasta entonces
   * la fila no admite acciones (por ejemplo, el tacho no abre el diálogo).
   */
  addUnit(unit: string) {
    cy.intercept('POST', '**/unidad').as('createUnit');
    cy.contains('button', 'Adicionar unidad').click();
    cy.focused().should('have.attr', 'placeholder', 'Valor...').type(`${unit}{enter}`);
    cy.wait('@createUnit').its('response.statusCode').should('eq', 200);
    this.row(unit).should('be.visible');
  }

  /**
   * Próximos números de unidad del piso: siguen al depto más alto que ya existe en la tabla.
   * Si el piso 1 tiene 101 a 104, con count = 2 devuelve ["105", "106"].
   */
  nextUnitNames(count: number, floor = 1) {
    const pattern = new RegExp(`^${floor}(\\d{2})$`);
    return cy.get(this.sel.unitCell).should('have.length.greaterThan', 0).then(($cells) => {
      const units = [...$cells].map((cell) => cell.innerText.trim().match(pattern)).filter(Boolean);
      const highest = Math.max(0, ...units.map((match) => Number(match![1])));
      return Array.from({ length: count }, (_, i) => buildUnitName(floor, highest + i + 1));
    });
  }

  /** Crea la próxima unidad del piso (depto más alto + 1) y le asigna ese piso. Devuelve su número. */
  addNextUnit(floor = 1) {
    return this.nextUnitNames(1, floor).then(([unit]) => {
      this.addUnit(unit);
      this.setFloor(unit, floor);
      return cy.wrap(unit);
    });
  }

  /** El piso se elige en un popup; el cambio se guarda con PUT /unidad/{id}. */
  setFloor(unit: string, floor: number) {
    cy.intercept('PUT', '**/unidad/*').as('updateUnit');
    this.row(unit).find('td[data-column-id="piso"] .chip').click();
    cy.get(`[role="tooltip"] span[title="Piso ${floor}"]`).click();
    cy.wait('@updateUnit').its('response.statusCode').should('eq', 200);
    this.row(unit).find('td[data-column-id="piso"]').should('contain', `Piso ${floor}`);
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

  deleteDialogTitle() {
    return cy.get(`${this.sel.dialog} #lebane-dialog-title`);
  }

  /** Cuerpo del diálogo de borrado con los espacios normalizados (los nombres van en negrita). */
  deleteDialogBody() {
    return cy
      .get(`${this.sel.dialog} #lebane-dialog-title`)
      .next()
      .invoke('prop', 'innerText')
      .then((text: string) => text.replace(/\s+/g, ' ').trim());
  }

  deleteDialogButton(text: string) {
    return cy.contains(`${this.sel.dialog} button`, text);
  }

  deleteDialogCloseButton() {
    return cy.get(`${this.sel.dialog} button[aria-label="close"]`);
  }

  confirmDelete() {
    cy.get(this.sel.dialog).contains('button', 'Confirmar').click();
    cy.get(this.sel.dialog).should('not.exist');
  }

  // --- Borrado masivo ---

  /** Checkbox del encabezado de la tabla ("Alternar seleccionar todo"). */
  selectAllRows() {
    cy.get(`${TABLE} thead input[aria-label="Alternar seleccionar todo"]`).check({ force: true });
  }

  rowsCounter() {
    return cy.contains(`${TABLE} span`, /\d+ filas?/).invoke('text').then((text) => text.trim());
  }

  /** Tacho de la barra de herramientas: elimina las filas seleccionadas. */
  requestBulkDelete() {
    cy.get('[data-testid="toolbar-eliminar-seleccionadas"]').should('be.enabled').click();
    return cy.contains(this.sel.dialog, 'Eliminar elementos');
  }

  bulkDeleteDialog() {
    return cy.contains(this.sel.dialog, 'Eliminar elementos');
  }

  /** Confirma y espera a que el proceso termine (la app muestra el progreso unidad por unidad). */
  confirmBulkDelete(successMessage: string) {
    this.bulkDeleteDialog().contains('button', 'Confirmar').click();
    return cy.contains(this.sel.dialog, successMessage, { timeout: 60000 });
  }

  closeBulkDeleteDialog() {
    this.bulkDeleteDialog().contains('button', 'Cerrar').click();
    cy.get(this.sel.dialog).should('not.exist');
  }

  toast(text: string) {
    return cy.contains('.Toastify__toast', text);
  }

  emptyTableMessage(text: string) {
    return cy.contains(this.sel.table, text);
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

  /**
   * Desplegable de listas: primer botón de la barra donde está "Templates".
   * No se ubica por "Adicionar unidad" porque ese botón cambia a "Debe subir un template" cuando no hay listas.
   */
  private priceListButton() {
    return cy.contains('button', 'Templates').closest('.MuiPaper-root').find('button').first();
  }

  /** Abre el desplegable de listas y devuelve el menú (incluye el mensaje cuando no hay listas). */
  openPriceListMenu() {
    this.priceListButton().click();
    return cy.get('[role="menu"]');
  }

  priceListButtonLabel() {
    return this.priceListButton().invoke('text').then((text) => text.trim());
  }

  primaryActionButton(text: string) {
    return cy.contains('button', text);
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

  /** Elegir la lista que ya está seleccionada no cierra el menú, así que en ese caso no se abre. */
  selectPriceList(name: string) {
    this.currentPriceList().then((current) => {
      if (current === name) return;
      this.priceListButton().click();
      cy.contains(this.sel.priceListItem, name).click();
      this.currentPriceList().should('eq', name);
    });
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
