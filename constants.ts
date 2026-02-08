
import { ReadingType } from './types';

export const DEPARTMENTS_ELECTRICITY = [
  "JIRAMA JOUR", "JIRAMA NUIT", "JIRAMA POINT", "ACTIF", "REACTIF", "ETP", 
  "HANK", "CHAUDIERE HFO", "CHAUDIERE BOIS", "COMPRESSEUR", "GENERATEUR", 
  "LAVAGE", "BUREAU", "FIN 01", "FIN 02", "MUP 01", "MUP 02", 
  "KNIT 01", "KNIT 02", "KNIT 03", "KNIT 04", "KNIT 05"
];

export const DEPARTMENTS_WATER = [
  "JIRAMA 01", "JIRAMA 02", "JIRAMA 03", "ETP", "CHAUDIERE", "HANK", "LAVAGE"
];

export const THEME_COLORS = {
  [ReadingType.ELECTRICITY]: {
    primary: 'blue-600',
    secondary: 'blue-100',
    text: 'blue-900'
  },
  [ReadingType.WATER]: {
    primary: 'emerald-600',
    secondary: 'emerald-100',
    text: 'emerald-900'
  }
};
