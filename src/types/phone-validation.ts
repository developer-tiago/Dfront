export interface PhoneValidationEvent {
  country?: string;
  countryCode?: string;
  countryCallingCode?: string;
  formatted?: string;
  nationalNumber?: string;
  number?: string;
  possible?: boolean;
  valid?: boolean;
}
