import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';

export interface TemplateUnit {
  name: string;
  price: number;
  floor?: number;
}

const BASE_TEMPLATE = 'cypress/fixtures/templates/template_unidades.xlsx';
const OUTPUT_DIR = 'cypress/tmp';

// Orden de columnas del template oficial descargado desde la app
const toRow = (unit: TemplateUnit) => {
  const row: (string | number)[] = [];
  row[1] = unit.name; // A  Numero de unidad (*)
  row[2] = 'Dos ambientes'; // B  Tipologia (*)
  row[3] = 'Frente'; // C  Orientacion (*)
  row[4] = 50; // D  M2 cubiertos (*)
  row[5] = 0; // E  M2 semi cubiertos (*)
  row[6] = 0; // F  M2 descubiertos (*)
  row[7] = 0; // G  M2 Comunes (*)
  row[8] = 50; // H  M2 totales (*)
  row[9] = unit.price; // I  Precio (*)
  row[10] = 'USD'; // J  Moneda (*)
  row[11] = 'DISPONIBLE'; // K  Estado (*)
  row[20] = unit.floor ?? 1; // T  Piso (*)
  return row;
};

/** Completa una copia del template oficial con las unidades indicadas y devuelve su ruta. */
export const buildUnitsTemplate = async (units: TemplateUnit[]): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(BASE_TEMPLATE);
  const sheet = workbook.worksheets[0];
  units.forEach((unit, i) => {
    sheet.getRow(i + 2).values = toRow(unit);
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, `unidades-${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(file);
  return file;
};
