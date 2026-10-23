import { loginPage } from '../../pages/LoginPage';
import { homePage } from '../../pages/HomePage';
import { userMenu } from '../../pages/UserMenu';

describe('Logout', () => {
  beforeEach(() => {
    // Login por UI y no con cy.session: el logout invalida la sesión cacheada
    loginPage.visit();
    cy.credentials().then(({ USER_EMAIL, USER_PASSWORD }) => loginPage.login(USER_EMAIL, USER_PASSWORD));
    homePage.isLoaded();
  });

  it('AUTH-08 cerrar sesión vuelve al login y elimina los tokens', () => {
    userMenu.logout();

    cy.location('pathname').should('include', '/sign-in');
    loginPage.form().should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('jwt_access_token'), 'access token').to.be.null;
      expect(win.localStorage.getItem('jwt_refresh_token'), 'refresh token').to.be.null;
    });
  });

  it('AUTH-09 después de cerrar sesión no se puede acceder a una ruta privada', () => {
    userMenu.logout();
    cy.location('pathname').should('include', '/sign-in');

    cy.visit('/');

    cy.location('pathname').should('include', '/sign-in');
  });
});
