import { loginPage } from '../../pages/LoginPage';
import { homePage } from '../../pages/HomePage';
import texts from '../../fixtures/login-texts.json';
import negativeCases from '../../fixtures/login-negative.json';

describe('Login', () => {
  beforeEach(() => {
    loginPage.visit();
  });

  it('AUTH-00 muestra los textos y el estado inicial de la pantalla', () => {
    loginPage.header().should('have.text', texts.header);
    loginPage.title().should('have.text', texts.title);
    loginPage.subtitle().should('have.text', texts.subtitle);
    loginPage.label(texts.emailLabel).should('be.visible');
    loginPage.label(texts.passwordLabel).should('be.visible');
    loginPage.emailInput().should('have.attr', 'placeholder', texts.emailPlaceholder).and('have.value', '');
    loginPage.passwordInput().should('have.attr', 'placeholder', texts.passwordPlaceholder).and('have.attr', 'type', 'password');
    loginPage.label(texts.rememberLabel).should('be.visible');
    loginPage.rememberCheckbox().should(texts.rememberCheckedByDefault ? 'be.checked' : 'not.be.checked');
    loginPage.submitButton().should('be.enabled').invoke('text').invoke('trim').should('eq', texts.submit);
    texts.links.forEach((link) => loginPage.link(link).should('be.visible'));
  });

  it('AUTH-01 ingresa con credenciales válidas', () => {
    cy.credentials().then(({ USER_EMAIL, USER_PASSWORD }) => loginPage.login(USER_EMAIL, USER_PASSWORD));

    loginPage.toast(texts.successToast).should('be.visible');
    cy.location('pathname').should('not.include', '/sign-in');
    homePage.isLoaded();
  });

  negativeCases.forEach(({ id, caso, email, password, errores }) => {
    it(`${id} no ingresa con ${caso}`, () => {
      const resolvedEmail = email === '$USER_EMAIL' ? cy.credentials().then((c) => c.USER_EMAIL) : cy.wrap(email);
      resolvedEmail.then((value) => loginPage.login(value, password));

      loginPage.fieldErrors().should('deep.equal', errores);
      cy.location('pathname').should('include', '/sign-in');
    });
  });

  describe('Recordarme', () => {
    it('AUTH-06 con "Recordarme" la sesión se mantiene al reabrir el navegador', () => {
      cy.credentials().then(({ USER_EMAIL, USER_PASSWORD }) =>
        loginPage.login(USER_EMAIL, USER_PASSWORD, { remember: true }),
      );
      homePage.isLoaded();

      cy.simulateBrowserRestart();

      cy.location('pathname').should('not.include', '/sign-in');
      homePage.isLoaded();
    });
  });
});
