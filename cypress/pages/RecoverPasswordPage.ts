class RecoverPasswordPage {
  private sel = {
    header: 'header h6',
    title: 'section h1',
    subtitle: 'section h1 + p',
    // La app reutiliza el nombre del formulario de login
    form: 'section form[name="loginForm"]',
    email: 'section form input[name="email"]',
    label: 'section form label',
    submit: 'section form button[type="submit"]',
    fieldError: '.MuiFormHelperText-root.Mui-error',
    toast: '.Toastify__toast',
  };

  visit() {
    cy.visit('/recuperar-contrasena');
    this.isLoaded();
  }

  isLoaded() {
    cy.location('pathname').should('eq', '/recuperar-contrasena');
    cy.get(this.sel.form).should('be.visible');
  }

  requestReset(email: string) {
    if (email) cy.get(this.sel.email).clear().type(email);
    cy.get(this.sel.submit).click();
  }

  fieldErrors() {
    return cy.get(this.sel.fieldError).then(($errors) => [...$errors].map((e) => e.innerText.trim()));
  }

  toast() {
    return cy.get(this.sel.toast);
  }

  // --- Elementos para validar wording ---

  header() {
    return cy.get(this.sel.header);
  }

  title() {
    return cy.get(this.sel.title);
  }

  subtitle() {
    return cy.get(this.sel.subtitle);
  }

  label() {
    return cy.get(this.sel.label);
  }

  emailInput() {
    return cy.get(this.sel.email);
  }

  submitButton() {
    return cy.get(this.sel.submit);
  }
}

export const recoverPasswordPage = new RecoverPasswordPage();
