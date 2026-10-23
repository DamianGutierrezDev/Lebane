export interface ProjectSetup {
  pricePerM2: number;
  floors: number;
  unitsPerFloor: number;
  priceListName?: string;
}

// Con 1 piso x 1 unidad por piso, el setup genera automáticamente la unidad "101" en la lista inicial
export const AUTO_UNIT = '101';

export const buildSetup =(overrides: Partial<ProjectSetup> = {}): ProjectSetup => ({
  pricePerM2: 1000,
  floors: 1,
  unitsPerFloor: 1,
  ...overrides,
});

export interface ProjectData {
  name: string;
  currency: string;
  country: string;
  state: string;
  city: string;
  street: string;
  number: string;
  endDate: string;
  // Sin valor se elige la primera opción del autocomplete
  constructionType?: string;
  adjustment?: string;
  businessName?: string;
}

export const formatDate = (date: Date) =>
  [date.getDate(), date.getMonth() + 1].map((n) => String(n).padStart(2, '0')).join('/') +
  `/${date.getFullYear()}`;

export const daysFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/** DDMMAAAA: formato que acepta el campo de fecha de MUI al tipear solo dígitos. */
export const dateDigits = (date: Date) => formatDate(date).replace(/\//g, '');

// Sufijo único para no chocar con datos de otras corridas en el ambiente compartido
export const uniqueSuffix = () => `${Date.now()}-${Cypress._.random(100, 999)}`;

export const buildProject = (overrides: Partial<ProjectData> = {}): ProjectData => {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  return {
    name: `QE-ALTA-${uniqueSuffix()}`,
    currency: 'USD',
    country: 'Argentina',
    state: 'Capital Federal',
    city: 'Palermo',
    street: 'Av. Santa Fe',
    number: '1234',
    endDate: formatDate(nextYear),
    ...overrides,
  };
};

export const buildRegistration = () => {
  const suffix = uniqueSuffix();
  return {
    company: `QA Auto Empresa ${suffix}`,
    email: `qa.auto.registro+${suffix}@lebane.test`,
    phone: '1122334455',
    country: 'Argentina',
  };
};

export const buildUnitName =(prefix = 'U') => `${prefix}-${uniqueSuffix()}`;
