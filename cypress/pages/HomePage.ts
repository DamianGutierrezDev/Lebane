class HomePage {
  private sel = {
    globalSearch: '[data-cy="home-search-button"]',
    projectsSearch: '[data-cy="home-proyectos-search"]',
  };

  visit() {
    cy.visit('/');
    cy.get(this.sel.globalSearch).should('be.visible');
  }

  isLoaded() {
    return cy.get(this.sel.globalSearch).should('be.visible');
  }

  clickAddProject() {
    cy.contains('button', 'Agregar proyecto').click();
  }

  /** Nombres de los proyectos visibles en la grilla de "Proyectos Desarrollo". */
  projectNames() {
    return cy
      .get('.MuiCollapse-root .MuiGrid-item p:first-of-type')
      .should('have.length.greaterThan', 0)
      .then(($names) => [...$names].map((n) => n.innerText.trim()).filter(Boolean));
  }

  openProject(name: string) {
    cy.get(this.sel.projectsSearch).clear().type(name);
    cy.contains('p', name).click();
  }
}

export const homePage = new HomePage();
