import { homePage } from './HomePage';
import type { ProjectData } from '../factories/project.factory';

const field = (name: string) => `[data-cy="new-renderer-field-${name}"]`;

export type AutocompleteField =
  | 'moneda'
  | 'pais'
  | 'estado'
  | 'ciudad'
  | 'jurisdiccionId'
  | 'tipoConstruccion'
  | 'modalidadAjuste'
  | 'documentoDeIdentidadTipo';

export type DateField = 'fechaInicio' | 'fechaFin';

class ProjectFormPage {
  private sel = {
    name: field('nombreProyecto'),
    currency: field('moneda'),
    country: field('pais'),
    state: field('estado'),
    city: field('ciudad'),
    street: field('calle'),
    number: field('numeroPuerta'),
    endDate: field('fechaFin'),
    constructionType: field('tipoConstruccion'),
    adjustment: field('modalidadAjuste'),
    businessName: '[name="razonSocial"] input',
    businessNewName: field('nombreRazonSocial'),
    businessDocumentNumber: field('documentoDeIdentidadNumero'),
    logoInput: 'input[id="file-logo del proyecto"]',
    logoPreview: 'img[alt="Uploaded Logo"]',
    logoDropZone: '[for="file-logo del proyecto"]',
    logoError: 'p.text-red-600',
    exchangeRate: 'input[name="tipoDeCambio"]',
    exchangeRateAuto: 'Definir automáticamente',
    option: '[role="listbox"] [role="option"]',
    noOptions: '.MuiAutocomplete-noOptions',
    fieldError: '.MuiFormHelperText-root.Mui-error',
    label: 'form label',
    submit: 'form button[type="submit"]',
    toast: '.Toastify__toast',
  };

  open() {
    homePage.visit();
    homePage.clickAddProject();
    cy.get(this.sel.name).should('be.visible');
    // El form se vuelve a montar cuando llega el tipo de cambio: interactuar antes deja campos "detached"
    cy.get(this.sel.exchangeRate).should('not.have.value', '');
  }

  fill(project: ProjectData) {
    this.fillProjectSection(project);
    this.select(this.sel.businessName, project.businessName);
  }

  /** Completa la sección "1 PROYECTO" sin tocar la razón social. */
  fillProjectSection(project: ProjectData) {
    cy.get(this.sel.name).type(project.name);
    this.select(this.sel.currency, project.currency);
    this.select(this.sel.country, project.country);
    // Estado y Ciudad se habilitan en cascada al elegir el país
    this.select(this.sel.state, project.state);
    this.select(this.sel.city, project.city);
    cy.get(this.sel.street).type(project.street);
    cy.get(this.sel.number).type(project.number);
    cy.get(this.sel.endDate).type(project.endDate);
    this.select(this.sel.constructionType, project.constructionType);
    this.select(this.sel.adjustment, project.adjustment);
  }

  /**
   * El input está oculto (la zona "Subir logo del proyecto" es su label) y acepta .jpg, .jpeg y .png.
   * Al elegir el archivo solo se muestra la vista previa: se sube recién al registrar el proyecto.
   */
  uploadLogo(filePath: string) {
    this.selectLogo(filePath);
    cy.get(this.sel.logoPreview).should('be.visible');
  }

  /** Carga el archivo sin esperar la vista previa (el `accept` del input no frena a selectFile). */
  selectLogo(filePath: string) {
    cy.get(this.sel.logoInput).selectFile(filePath, { force: true });
  }

  logoPreview() {
    return cy.get(this.sel.logoPreview);
  }

  logoDropZone() {
    return cy.get(this.sel.logoDropZone);
  }

  /** El mensaje de error se muestra debajo del recuadro del logo. */
  logoError() {
    return cy.get(this.sel.logoInput).parent().find(this.sel.logoError);
  }

  submit() {
    cy.get(this.sel.submit).should('be.enabled').click();
  }

  submitButton() {
    return cy.get(this.sel.submit);
  }

  toast() {
    return cy.get(this.sel.toast);
  }

  fieldError(text: string) {
    return cy.contains(this.sel.fieldError, text);
  }

  input(name: string) {
    return cy.get(field(name));
  }

  type(name: string, value: string) {
    cy.get(field(name)).clear().type(value);
  }

  // --- Autocompletes ---

  autocomplete(name: AutocompleteField) {
    return cy.get(field(name));
  }

  selectOption(name: AutocompleteField, option?: string) {
    this.select(field(name), option);
  }

  searchOption(name: AutocompleteField, text: string) {
    cy.get(field(name)).should('be.enabled').clear().type(text);
  }

  noOptionsMessage() {
    return cy.get(this.sel.noOptions);
  }

  options() {
    return cy.get(this.sel.option);
  }

  closeOptions() {
    cy.get('body').type('{esc}');
  }

  // --- Tipo de cambio ---

  exchangeRateInput() {
    return cy.get(this.sel.exchangeRate);
  }

  setManualExchangeRate(value: string) {
    cy.get(this.sel.exchangeRate).then(($input) => {
      if ($input.prop('disabled')) cy.contains(this.sel.label, this.sel.exchangeRateAuto).click();
    });
    cy.get(this.sel.exchangeRate).should('be.enabled').clear();
    if (value) cy.get(this.sel.exchangeRate).type(value);
    cy.get(this.sel.exchangeRate).blur();
  }

  // --- Fechas ---

  /** Reemplaza la fecha tipeando solo dígitos (DDMMAAAA): el campo de MUI completa los separadores. */
  setDate(name: DateField, digits: string) {
    cy.get(field(name)).click().type('{ctrl+a}{backspace}');
    cy.get(field(name)).type(digits).blur();
  }

  // --- Razón social ---

  createBusinessName(name: string) {
    cy.get(this.sel.businessName).type(name);
    cy.contains(this.sel.option, `Crear nueva razón social "${name}"`).click();
    cy.get(this.sel.businessNewName).should('have.value', name);
  }

  businessNewNameInput() {
    return cy.get(this.sel.businessNewName);
  }

  setBusinessDocumentNumber(value: string) {
    cy.get(this.sel.businessDocumentNumber).clear().type(value);
  }

  label(text: string) {
    return cy.contains(this.sel.label, text);
  }

  /** Autocomplete de MUI: sin opción indicada elige la primera disponible. */
  private select(selector: string, option?: string) {
    cy.get(selector).should('be.enabled').click();
    // Las opciones se cargan async: tipear antes de que lleguen deja el campo vacío
    cy.get(this.sel.option).should('have.length.greaterThan', 0);
    (option ? cy.contains(this.sel.option, option) : cy.get(this.sel.option).first()).click();
    cy.get(selector).should('not.have.value', '');
  }
}

export const projectFormPage = new ProjectFormPage();
