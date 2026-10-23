import { loginPage } from '../../pages/LoginPage';
import { recoverPasswordPage } from '../../pages/RecoverPasswordPage';
import texts from '../../fixtures/recover-password-texts.json';

// Nunca se usa el email de la cuenta de prueba: resetearle la contraseña rompería el resto de la suite
const NON_EXISTENT_EMAIL = 'no.existe.qa.auto@lebane.test';

const spyReset = () => cy.intercept('POST', '**/users/reset-password').as('reset');

describe('Recuperar contraseña', () => {
  it('REC-01 desde el login, "Recuperar contraseña" lleva a la pantalla de recuperación', () => {
    loginPage.visit();
    cy.contains('section p', '¿Has olvidado tu contraseña?').should('contain', 'Recuperar contraseña');

    loginPage.goToRecoverPassword();

    recoverPasswordPage.isLoaded();
  });

  describe('Pantalla de recuperación', () => {
    beforeEach(() => {
      spyReset();
      recoverPasswordPage.visit();
    });

    it('REC-02 muestra los textos esperados', () => {
      recoverPasswordPage.header().should('have.text', texts.header);
      recoverPasswordPage.title().should('have.text', texts.title);
      recoverPasswordPage.subtitle().should('have.text', texts.subtitle);
      recoverPasswordPage.label().should('have.text', texts.emailLabel);
      recoverPasswordPage
        .emailInput()
        .should('have.attr', 'placeholder', texts.emailPlaceholder)
        .and('have.value', '');
      recoverPasswordPage.submitButton().should('be.enabled').and('have.text', texts.submit);
    });

    it('REC-03 informa que el correo es obligatorio y no envía la solicitud', () => {
      recoverPasswordPage.requestReset('');

      recoverPasswordPage.fieldErrors().should('deep.equal', [texts.requiredError]);
      cy.get('@reset.all').should('have.length', 0);
    });

    it('REC-04 valida el formato del correo y no envía la solicitud', () => {
      recoverPasswordPage.requestReset('asdas');

      recoverPasswordPage.fieldErrors().should('deep.equal', [texts.invalidEmailError]);
      cy.get('@reset.all').should('have.length', 0);
    });

    // Hoy falla: el backend responde 400 pero la UI confirma el reseteo igual (ver README)
    it('REC-05 con un correo no registrado no confirma el reseteo de la contraseña', () => {
      recoverPasswordPage.requestReset(NON_EXISTENT_EMAIL);

      cy.wait('@reset').its('request.body').should('include', encodeURIComponent(NON_EXISTENT_EMAIL));
      // El toast se cierra solo: se lee una vez en lugar de reintentar una aserción negativa hasta que desaparezca
      recoverPasswordPage
        .toast()
        .should('be.visible')
        .invoke('text')
        .then((text) => expect(text, 'mensaje mostrado').not.to.contain(texts.resetToast));
      recoverPasswordPage.isLoaded();
    });
  });
});
