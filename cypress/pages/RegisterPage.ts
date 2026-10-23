class RegisterPage {
  private sel = {
    header: 'header h6',
    title: 'section h1',
    subtitle: 'section h1 + p',
    form: 'form[name="registerForm"]',
    input: (name: string) => `form[name="registerForm"] input[name="${name}"]`,
    country: '[data-cy="new-renderer-field-pais"]',
    option: '[role="listbox"] [role="option"]',
    submit: 'form[name="registerForm"] button[type="submit"]',
    fieldError: '.MuiFormHelperText-root.Mui-error',
    loginPrompt: 'section form + p',
    confirmationTitle: 'section h1',
    confirmationMessage: 'section h1 + p',
    confirmationLogin: 'section a[href$="/sign-in"]',
  };

  fill({ company, email, phone, country }: { company: string; email: string; phone: string; country: string }) {
    this.type('nombre', company);
    this.type('email', email);
    this.type('telefono', phone);
    cy.get(this.sel.country).click();
    cy.contains(this.sel.option, country).click();
    cy.get(this.sel.country).should('have.value', country);
  }

  errorToast() {
    return cy.get('.Toastify__toast--error');
  }

  confirmationTitle() {
    return cy.get(this.sel.confirmationTitle);
  }

  confirmationMessage() {
    return cy.get(this.sel.confirmationMessage);
  }

  confirmationHelp() {
    return cy.contains('section p', 'Si no recibes');
  }

  confirmationLoginLink() {
    return cy.get(this.sel.confirmationLogin);
  }

  visit() {
    cy.visit('/sign-up');
    this.isLoaded();
  }

  isLoaded() {
    cy.location('pathname').should('eq', '/sign-up');
    cy.get(this.sel.form).should('be.visible');
  }

  type(name: string, value: string) {
    cy.get(this.sel.input(name)).clear().type(value);
  }

  submit() {
    cy.get(this.sel.submit).click();
  }

  fieldErrors() {
    return cy.get(this.sel.fieldError).then(($errors) => [...$errors].map((e) => e.innerText.trim()));
  }

  countryOptions() {
    cy.get(this.sel.country).click();
    return cy
      .get(this.sel.option)
      .then(($options) => [...$options].map((o) => o.innerText.trim()))
      .then((options) => {
        cy.get('body').type('{esc}');
        return cy.wrap(options);
      });
  }

  goToLogin() {
    cy.get(this.sel.loginPrompt).contains('span', /^Ingresar$/).click();
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

  label(text: string) {
    return cy.contains(`${this.sel.form} label`, text);
  }

  input(name: string) {
    return cy.get(this.sel.input(name));
  }

  countryInput() {
    return cy.get(this.sel.country);
  }

  submitButton() {
    return cy.get(this.sel.submit);
  }

  loginPrompt() {
    return cy.get(this.sel.loginPrompt);
  }
}

export const registerPage = new RegisterPage();
