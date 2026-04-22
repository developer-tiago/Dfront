import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Converte +5514998548339 em (14) 99854-8339
 * Se o número for inválido, retorna a string original.
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '---';

  const phoneNumber = parsePhoneNumberFromString(phone);

  if (!phoneNumber) return phone; // Fallback: retorna o original se não conseguir parsear

  return phoneNumber.formatNational();
};
