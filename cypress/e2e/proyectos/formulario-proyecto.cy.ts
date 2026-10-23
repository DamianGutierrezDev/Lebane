import { projectFormPage, type AutocompleteField } from '../../pages/ProjectFormPage';
import { homePage } from '../../pages/HomePage';
import { buildProject, dateDigits, daysFromToday, uniqueSuffix } from '../../factories/project.factory';
import form from '../../fixtures/project-form.json';

// Validaciones de inputs del alta de proyecto. Ningún test crea proyectos: solo PF-16 hace clic
// en Registrar, con un nombre duplicado que la app rechaza.
// Los casos marcados "Hoy falla" documentan bugs reportados (ver README).

describe('Formulario de proyecto: validaciones', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Autocompletes', () => {
    beforeEach(() => projectFormPage.open());

    form.autocompletes.forEach(({ field, label, requires }) => {
      it(`PF-01 ${label}: un valor inexistente muestra "${form.noOptionsMessage}"`, () => {
        if (requires?.pais) projectFormPage.selectOption('pais', requires.pais);
        if (requires?.estado) projectFormPage.selectOption('estado', requires.estado);

        projectFormPage.searchOption(field as AutocompleteField, form.nonExistentOption);

        projectFormPage.noOptionsMessage().should('have.text', form.noOptionsMessage);
        projectFormPage.options().should('not.exist');
      });
    });

    it('PF-02 Estado y Ciudad se habilitan en cascada desde País', () => {
      projectFormPage.autocomplete('estado').should('be.disabled');
      projectFormPage.autocomplete('ciudad').should('be.disabled');

      projectFormPage.selectOption('pais', 'Argentina');
      projectFormPage.autocomplete('estado').should('be.enabled');
      projectFormPage.autocomplete('ciudad').should('be.disabled');

      projectFormPage.selectOption('estado', 'Capital Federal');
      projectFormPage.autocomplete('ciudad').should('be.enabled');
    });

    it('PF-03 cambiar el Estado limpia la Ciudad elegida', () => {
      projectFormPage.selectOption('pais', 'Argentina');
      projectFormPage.selectOption('estado', 'Capital Federal');
      projectFormPage.selectOption('ciudad', 'Palermo');

      projectFormPage.selectOption('estado', 'Córdoba');

      projectFormPage.autocomplete('ciudad').should('have.value', '');
    });

    form.countries.forEach(({ name, states, firstState }) => {
      it(`PF-04 ${name} carga sus propios estados`, () => {
        projectFormPage.selectOption('pais', name);

        projectFormPage.autocomplete('estado').should('be.enabled').click();
        // La lista se recarga al cambiar de país: el largo esperado espera a que llegue la del país elegido
        projectFormPage.options().should('have.length', states).first().should('have.text', firstState);
      });
    });
  });

  describe('Tipo de cambio manual', () => {
    beforeEach(() => {
      projectFormPage.open();
      projectFormPage.fill(buildProject());
      projectFormPage.submitButton().should('be.enabled');
    });

    form.exchangeRate.invalid.forEach(({ caso, value }) => {
      it(`PF-05 rechaza un tipo de cambio ${caso}`, () => {
        projectFormPage.setManualExchangeRate(value);

        projectFormPage.fieldError(form.exchangeRate.error).should('be.visible');
        projectFormPage.submitButton().should('be.disabled');
      });
    });

    it('PF-06 acepta y formatea un tipo de cambio válido', () => {
      projectFormPage.setManualExchangeRate(form.exchangeRate.valid.value);

      projectFormPage.exchangeRateInput().should('have.value', form.exchangeRate.valid.formatted);
      projectFormPage.fieldError(form.exchangeRate.error).should('not.exist');
      projectFormPage.submitButton().should('be.enabled');
    });

    // Hoy falla (bug A): lo acepta y lo redondea a 100.000.000.000.000.020.000
    it('PF-07 rechaza un tipo de cambio fuera de rango', () => {
      projectFormPage.setManualExchangeRate(form.exchangeRate.outOfRange);

      projectFormPage.submitButton().should('be.disabled');
    });
  });

  describe('Fechas de inicio y finalización', () => {
    beforeEach(() => {
      projectFormPage.open();
      projectFormPage.fill(buildProject());
      projectFormPage.submitButton().should('be.enabled');
    });

    // Hoy falla (bug B)
    it('PF-08 no permite una fecha de finalización anterior a la de inicio', () => {
      projectFormPage.setDate('fechaInicio', dateDigits(daysFromToday(10)));
      projectFormPage.setDate('fechaFin', dateDigits(daysFromToday(5)));

      projectFormPage.submitButton().should('be.disabled');
    });

    // Hoy falla (bug C)
    it('PF-09 no permite una fecha de inicio en el pasado', () => {
      projectFormPage.setDate('fechaInicio', dateDigits(daysFromToday(-30)));
      projectFormPage.setDate('fechaFin', dateDigits(daysFromToday(365)));

      projectFormPage.submitButton().should('be.disabled');
    });

    // Hoy falla (bug D)
    it('PF-10 no permite un período de inicio y fin ya transcurrido', () => {
      projectFormPage.setDate('fechaInicio', dateDigits(daysFromToday(-10)));
      projectFormPage.setDate('fechaFin', dateDigits(daysFromToday(-7)));

      projectFormPage.submitButton().should('be.disabled');
    });

    // Hoy falla (bug E): queda "15/10/YYYY" y Registrar sigue habilitado
    it('PF-11 no permite una fecha incompleta', () => {
      projectFormPage.setDate('fechaFin', '1510');

      projectFormPage.submitButton().should('be.disabled');
    });

    // Hoy falla (bug F): tipear en formato mm/dd genera 12/03/0006 y lo acepta
    it('PF-12 no permite fechas anteriores a 1900', () => {
      projectFormPage.setDate('fechaFin', '12312026');

      projectFormPage.submitButton().should('be.disabled');
    });
  });

  describe('Campos alfanuméricos', () => {
    beforeEach(() => projectFormPage.open());

    it('PF-13 acepta un número de dirección alfanumérico', () => {
      projectFormPage.fill(buildProject({ number: form.alphanumeric.streetNumber }));

      projectFormPage.input('numeroPuerta').should('have.value', form.alphanumeric.streetNumber);
      projectFormPage.submitButton().should('be.enabled');
    });

    it('PF-14 acepta un número de documento alfanumérico en la razón social', () => {
      projectFormPage.fillProjectSection(buildProject());
      projectFormPage.createBusinessName(`QE Razon ${uniqueSuffix()}`);
      projectFormPage.selectOption('documentoDeIdentidadTipo', 'DNI');

      projectFormPage.setBusinessDocumentNumber(form.alphanumeric.documentNumber);

      projectFormPage.input('documentoDeIdentidadNumero').should('have.value', form.alphanumeric.documentNumber);
      projectFormPage.submitButton().should('be.enabled');
    });
  });

  describe('Razón social nueva', () => {
    beforeEach(() => projectFormPage.open());

    it('PF-15 crear una razón social pide sus datos y habilita Registrar al completarlos', () => {
      const businessName = `QE Razon ${uniqueSuffix()}`;
      projectFormPage.fillProjectSection(buildProject());

      projectFormPage.createBusinessName(businessName);

      form.businessNameFields.forEach((label) => projectFormPage.label(label).should('be.visible'));
      projectFormPage.submitButton().should('be.disabled');

      projectFormPage.selectOption('documentoDeIdentidadTipo', 'CUIT');
      projectFormPage.submitButton().should('be.disabled');
      projectFormPage.setBusinessDocumentNumber('20123456789');
      projectFormPage.submitButton().should('be.enabled');

      projectFormPage.businessNewNameInput().clear();
      projectFormPage.submitButton().should('be.disabled');
    });
  });

  describe('Nombre de proyecto', () => {
    it('PF-16 no permite registrar un proyecto con un nombre existente', () => {
      homePage.visit();
      homePage.projectNames().then((names) => {
        const existing = names.find((name) => name !== 'General')!;

        projectFormPage.open();
        projectFormPage.fill(buildProject({ name: existing }));
        projectFormPage.submit();

        projectFormPage.toast().should('contain', form.duplicateNameToast.replace('{name}', existing));
        cy.location('pathname').should('eq', '/primer-proyecto');
        cy.contains('Creación exitosa').should('not.exist');
      });
    });
  });
});
