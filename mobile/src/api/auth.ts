import { apiRequest } from "./client";
import type { AuthSession, SignInInput, SignUpInput } from "../auth/types";

type SignupResponse = { message?: string };
type ConfirmResetCodeResponse = { message: string; reset_token: string };

export const authApi = {
  signIn(input: SignInInput) {
    return apiRequest<AuthSession>("auth/login/", {
      method: "POST",
      body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password }),
    });
  },

  signUp(input: SignUpInput) {
    return apiRequest<SignupResponse>("auth/signup/", {
      method: "POST",
      body: JSON.stringify({
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: input.role,
        phone_number: input.phoneNumber.trim(),
        terms_accepted: input.termsAccepted,
      }),
    });
  },

  forgotPassword(email: string) {
    return apiRequest<{ message: string }>("auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  confirmResetCode(email: string, code: string) {
    return apiRequest<ConfirmResetCodeResponse>("auth/confirm-code/", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
    });
  },

  resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return apiRequest<{ message: string }>(`auth/reset-password/${token}/`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
    });
  },
};
