import { loginPage } from '../../pages/LoginPage';
import { registerPage } from '../../pages/RegisterPage';
import texts from '../../fixtures/register-texts.json';
import { buildRegistration } from '../../factories/project.factory';

// Spy sin stub: el alta llega al backend real
const spyRegistration = () => cy.intercept('POST', '**/orgsis/add').as('register');

describe('Registro', () => {
  it('REG-01 desde el login, "Registrarme" lleva a la pantalla de registro', () => {
    loginPage.visit();
    cy.contains('section p', '¿Eres nuevo en Lebane?').should('contain', 'Registrarme');

    loginPage.goToRegister();

    registerPage.isLoaded();
  });

  describe('Pantalla de registro', () => {
    beforeEach(() => {
      registerPage.visit();
    });

    it('REG-02 muestra los textos y campos esperados', () => {
      registerPage.header().should('have.text', texts.header);
      registerPage.title().should('have.text', texts.title);
      registerPage.subtitle().should('have.text', texts.subtitle);
      texts.fields.forEach(({ label, name, placeholder }) => {
        registerPage.label(label).should('be.visible');
        registerPage.input(name).should('have.attr', 'placeholder', placeholder).and('have.value', '');
      });
      registerPage.label(texts.countryLabel).should('be.visible');
      registerPage.countryInput().should('have.attr', 'placeholder', texts.countryPlaceholder);
      registerPage.submitButton().should('be.enabled').invoke('text').invoke('trim').should('eq', texts.submit);
      registerPage.loginPrompt().should('contain', texts.loginPrompt).and('contain', texts.loginLink);
    });

    it('REG-03 ofrece los países habilitados', () => {
      registerPage.countryOptions().should('deep.equal', texts.countries);
    });

    it('REG-04 informa todos los campos obligatorios al enviar vacío', () => {
      registerPage.submit();

      registerPage.fieldErrors().should('deep.equal', texts.requiredErrors);
      cy.location('pathname').should('eq', '/sign-up');
    });

    it('REG-05 valida el formato del correo electrónico', () => {
      registerPage.type('email', 'usuario-sin-arroba');
      registerPage.submit();

      registerPage.fieldErrors().should('include', texts.invalidEmailError);
    });

    it('REG-06 el teléfono no acepta letras', () => {
      registerPage.type('telefono', 'abc');

      registerPage.input('telefono').should('have.value', '');
    });

    it('REG-07 "Ingresar" vuelve al login', () => {
      registerPage.goToLogin();

      cy.location('pathname').should('eq', '/sign-in');
      loginPage.form().should('be.visible');
    });
  });

  // Contra el backend real: el email de la cuenta de prueba ya existe, así que el alta se rechaza y no crea nada
  it('REG-10 no permite registrar un correo electrónico existente', () => {
    spyRegistration();
    registerPage.visit();

    cy.credentials().then(({ USER_EMAIL }) =>
      registerPage.fill({ ...buildRegistration(), email: USER_EMAIL }),
    );
    registerPage.submit();

    cy.wait('@register').its('response.statusCode').should('be.gte', 400);
    registerPage.errorToast().should('contain', texts.duplicateEmailToast);
    registerPage.isLoaded();
    cy.contains(texts.confirmation.title).should('not.exist');
  });

  // Alta real: cada corrida crea una organización nueva con email único en el ambiente de testing
  describe('Confirmación de registro', () => {
    let registration: ReturnType<typeof buildRegistration>;

    beforeEach(() => {
      registration = buildRegistration();
      spyRegistration();
      registerPage.visit();
      registerPage.fill(registration);
      registerPage.submit();
      cy.wait('@register').its('response.statusCode').should('be.within', 200, 299);
    });

    it('REG-08 registra la cuenta y muestra la confirmación', () => {
      registerPage.confirmationTitle().should('have.text', texts.confirmation.title);
      registerPage
        .confirmationMessage()
        .should('have.text', texts.confirmation.message.replace('{email}', registration.email));
      registerPage
        .confirmationHelp()
        .should('have.text', texts.confirmation.help)
        .and('contain', texts.confirmation.helpLink);
    });

    it('REG-09 "Iniciar sesión" lleva al login', () => {
      registerPage.confirmationLoginLink().should('have.text', texts.confirmation.loginLink).click();

      cy.location('pathname').should('eq', '/sign-in');
      loginPage.form().should('be.visible');
    });
  });
});
