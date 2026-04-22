export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRegister {
  account_name: string;
  account_slug: string;
  account_country_code: string;
  account_phone: string;
  account_phone_validate: boolean;
  user_name: string;
  user_email: string;
  user_password: string;
}

export interface User {
  id: string;
  account_id: string;
  name: string;
  account_name?: string;
  password?: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ProfileUpdateData {
  name: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}
