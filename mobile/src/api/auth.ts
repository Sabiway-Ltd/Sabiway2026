import { apiRequest } from "./client";
import type { AuthSession, SignInInput, SignUpInput } from "../auth/types";

type SignupResponse = {
  message?: string;
};

export const authApi = {
  signIn(input: SignInInput) {
    return apiRequest<AuthSession>("auth/login/", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  signUp(input: SignUpInput) {
    return apiRequest<SignupResponse>("auth/signup/", {
      method: "POST",
      body: JSON.stringify({
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });
  },
};
