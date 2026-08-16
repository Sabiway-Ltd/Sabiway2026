export type AccountRole = "client" | "professional";

export type AuthScreen = "welcome" | "role" | "sign-in" | "sign-up" | "check-email";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  role: AccountRole;
};

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
};

export type AuthSession = {
  access: string;
  refresh: string;
  user: AuthUser;
};
