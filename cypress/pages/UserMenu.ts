// Menú que se abre desde el avatar, al pie del sidebar
class UserMenu {
  private sel = {
    avatarButton: '#fuse-navbar .MuiAvatar-root',
    logout: 'a[role="menuitem"][href="/sign-out"]',
  };

  open() {
    cy.get(this.sel.avatarButton).closest('button').click();
    cy.get(this.sel.logout).should('be.visible');
  }

  logout() {
    this.open();
    cy.get(this.sel.logout).click();
  }
}

export const userMenu = new UserMenu();
