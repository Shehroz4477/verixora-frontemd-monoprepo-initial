import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
}

@Injectable({ providedIn: 'root' })
export class CountryService {
  private defaultCountry: Country = {
    code: 'PK',
    name: 'Pakistan',
    dial: '+92',
    flag: '🇵🇰',
    minDigits: 9,
    maxDigits: 10
  };

  countries: Country[] = [
    // === North America ===
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10 },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10 },

    // === Europe ===
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 10 },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11 },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 10 },
    { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', minDigits: 9, maxDigits: 11 },
    { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9 },
    { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 10 },
    { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪', minDigits: 7, maxDigits: 9 },
    { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 10 },
    { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', minDigits: 8, maxDigits: 8 },
    { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', minDigits: 8, maxDigits: 8 },
    { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮', minDigits: 9, maxDigits: 10 },
    { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', minDigits: 9, maxDigits: 9 },
    { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷', minDigits: 10, maxDigits: 10 },
    { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', minDigits: 9, maxDigits: 9 },
    { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪', minDigits: 9, maxDigits: 10 },
    { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺', minDigits: 10, maxDigits: 10 },
    { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷', minDigits: 10, maxDigits: 10 },

    // === Asia ===
    { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰', minDigits: 9, maxDigits: 10 },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', minDigits: 10, maxDigits: 10 },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', minDigits: 11, maxDigits: 11 },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10 },
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷', minDigits: 9, maxDigits: 10 },
    { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩', minDigits: 9, maxDigits: 12 },
    { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10 },
    { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭', minDigits: 10, maxDigits: 10 },
    { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭', minDigits: 9, maxDigits: 9 },
    { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳', minDigits: 9, maxDigits: 10 },
    { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8 },
    { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9 },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9 },
    { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱', minDigits: 9, maxDigits: 9 },
    { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼', minDigits: 9, maxDigits: 9 },

    // === Oceania ===
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 10 },
    { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿', minDigits: 8, maxDigits: 10 },

    // === South America ===
    { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', minDigits: 10, maxDigits: 11 },
    { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', minDigits: 10, maxDigits: 10 },
    { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', minDigits: 10, maxDigits: 10 },
    { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', minDigits: 10, maxDigits: 10 },
    { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', minDigits: 9, maxDigits: 9 },

    // === Africa ===
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9 },
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', minDigits: 10, maxDigits: 10 },
    { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬', minDigits: 10, maxDigits: 10 },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', minDigits: 10, maxDigits: 10 },
    { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦', minDigits: 9, maxDigits: 9 },
    { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿', minDigits: 9, maxDigits: 9 },
    { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳', minDigits: 8, maxDigits: 8 },
    { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾', minDigits: 9, maxDigits: 9 },
    { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹', minDigits: 9, maxDigits: 9 },
    { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭', minDigits: 9, maxDigits: 9 },
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿', minDigits: 9, maxDigits: 9 },
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬', minDigits: 9, maxDigits: 9 },
    { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼', minDigits: 9, maxDigits: 9 },
    { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩', minDigits: 9, maxDigits: 9 },
    { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲', minDigits: 9, maxDigits: 9 },
    { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼', minDigits: 9, maxDigits: 9 },
    { code: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦', minDigits: 9, maxDigits: 9 },
    { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼', minDigits: 9, maxDigits: 9 },
    { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿', minDigits: 9, maxDigits: 9 },
    { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴', minDigits: 9, maxDigits: 9 },
    { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲', minDigits: 9, maxDigits: 9 },
    { code: 'CI', name: 'Ivory Coast', dial: '+225', flag: '🇨🇮', minDigits: 9, maxDigits: 9 },
    { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳', minDigits: 9, maxDigits: 9 },
    { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱', minDigits: 9, maxDigits: 9 },
    { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫', minDigits: 9, maxDigits: 9 },
    { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪', minDigits: 9, maxDigits: 9 },
    { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯', minDigits: 9, maxDigits: 9 },
    { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬', minDigits: 9, maxDigits: 9 },
  ];

  constructor() {}

  async getCountryCode(): Promise<string> {
    try {
      const langTag = await Device.getLanguageTag();
      if (langTag) {
        const parts = langTag.value.split('-');
        if (parts.length > 1) return parts[1].toUpperCase();
      }
    } catch {}
    const lang = navigator.language || 'en-US';
    const parts = lang.split('-');
    if (parts.length > 1) return parts[1].toUpperCase();
    return 'PK';
  }

  getCountryByCode(code: string): Country {
    return this.countries.find(c => c.code === code) || this.defaultCountry;
  }

  getDialCode(countryCode: string): string {
    return this.getCountryByCode(countryCode).dial;
  }

  getDigitsForCountry(countryCode: string): { min: number; max: number } {
    const country = this.getCountryByCode(countryCode);
    return { min: country.minDigits, max: country.maxDigits };
  }
}