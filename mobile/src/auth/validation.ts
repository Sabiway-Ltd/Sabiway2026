import type { SignInInput, SignUpInput } from "./types";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nigeriaPhonePattern = /^(?:0(?:70|71|80|81|90|91)\d{8}|\+?234(?:70|71|80|81|90|91)\d{8})$/;

export function validateSignIn(input: SignInInput): FieldErrors<SignInInput> {
  const errors: FieldErrors<SignInInput> = {};
  if (!emailPattern.test(input.email.trim())) errors.email = "Enter a valid email address.";
  if (!input.password) errors.password = "Enter your password.";
  return errors;
}

export function validateSignUp(input: SignUpInput): FieldErrors<SignUpInput> {
  const errors: FieldErrors<SignUpInput> = {};
  if (input.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!emailPattern.test(input.email.trim())) errors.email = "Enter a valid email address.";
  if (input.password.length < 8) errors.password = "Use at least 8 characters.";
  if (!input.role) errors.role = "Choose how you want to use SabiWay.";
  const compactPhone = input.phoneNumber.replace(/[\s().-]/g, "");
  if (compactPhone && !nigeriaPhonePattern.test(compactPhone)) {
    errors.phoneNumber = "Use a valid Nigerian mobile number, for example 08012345678 or +2348012345678.";
  }
  if (!input.termsAccepted) errors.termsAccepted = "Accept the SabiWay terms to continue.";
  return errors;
}
