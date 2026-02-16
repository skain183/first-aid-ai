
import { CountryProfile } from '../types';

export const COUNTRIES: CountryProfile[] = [
  { country_name: 'Saudi Arabia', country_code: 'SA', dial_code: '+966', emergency_number: '911', region: 'Middle East' },
  { country_name: 'United Arab Emirates', country_code: 'AE', dial_code: '+971', emergency_number: '999', region: 'Middle East' },
  { country_name: 'Kuwait', country_code: 'KW', dial_code: '+965', emergency_number: '112', region: 'Middle East' },
  { country_name: 'Qatar', country_code: 'QA', dial_code: '+974', emergency_number: '999', region: 'Middle East' },
  { country_name: 'Bahrain', country_code: 'BH', dial_code: '+973', emergency_number: '999', region: 'Middle East' },
  { country_name: 'Oman', country_code: 'OM', dial_code: '+968', emergency_number: '9999', region: 'Middle East' },
  { country_name: 'United States', country_code: 'US', dial_code: '+1', emergency_number: '911', region: 'North America' },
  { country_name: 'United Kingdom', country_code: 'GB', dial_code: '+44', emergency_number: '999', region: 'Europe' },
  { country_name: 'Canada', country_code: 'CA', dial_code: '+1', emergency_number: '911', region: 'North America' },
  { country_name: 'India', country_code: 'IN', dial_code: '+91', emergency_number: '112', region: 'Asia' },
  { country_name: 'Australia', country_code: 'AU', dial_code: '+61', emergency_number: '000', region: 'Australia' },
  { country_name: 'France', country_code: 'FR', dial_code: '+33', emergency_number: '112', region: 'Europe' },
  { country_name: 'Germany', country_code: 'DE', dial_code: '+49', emergency_number: '112', region: 'Europe' },
  { country_name: 'General / Other', country_code: 'XX', dial_code: '', emergency_number: '112', region: 'Global' },
];

export const getCountryByCode = (code: string): CountryProfile | undefined => {
  return COUNTRIES.find(c => c.country_code === code);
};

export const getCountryByName = (name: string): CountryProfile | undefined => {
  return COUNTRIES.find(c => c.country_name === name);
};
