class LoginPage {
  private sel = {
    header: 'header h6',
    title: 'section h1',
    subtitle: 'section h1 + p',
    form: 'form[name="loginForm"]',
    email: 'input[name="email"]',
    password: 'input[name="password"]',
    remember: '#remember',
    rememberLabel: 'label[for="remember"]',
    submit: 'form[name="loginForm"] button[type="submit"]',
    fieldError: '.MuiFormHelperText-root.Mui-error',
    toast: '.Toastify__toast',
  };

  visit() {
    cy.visit('/sign-in');
    cy.get(this.sel.form).should('be.visible');
  }

  login(email: string, password: string, { remember }: { remember?: boolean } = {}) {
    if (remember !== undefined) this.setRemember(remember);
    if (email) cy.get(this.sel.email).clear().type(email);
    if (password) cy.get(this.sel.password).clear().type(password, { log: false });
    cy.get(this.sel.submit).click();
  }

  setRemember(checked: boolean) {
    cy.get(this.sel.remember).then(($checkbox) => {
      if ($checkbox.prop('checked') !== checked) cy.get(this.sel.rememberLabel).click();
    });
    cy.get(this.sel.remember).should(checked ? 'be.checked' : 'not.be.checked');
  }

  form() {
    return cy.get(this.sel.form);
  }

  goToRegister() {
    this.link('Registrarme').click();
  }

  goToRecoverPassword() {
    this.link('Recuperar contraseña').click();
  }

  fieldErrors() {
    return cy.get(this.sel.fieldError).then(($errors) => [...$errors].map((e) => e.innerText.trim()));
  }

  toast(text: string) {
    return cy.contains(this.sel.toast, text);
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

  emailInput() {
    return cy.get(this.sel.email);
  }

  passwordInput() {
    return cy.get(this.sel.password);
  }

  rememberCheckbox() {
    return cy.get(this.sel.remember);
  }

  submitButton() {
    return cy.get(this.sel.submit);
  }

  link(text: string) {
    return cy.contains('section span.cursor-pointer', text);
  }
}

export const loginPage = new LoginPage();
