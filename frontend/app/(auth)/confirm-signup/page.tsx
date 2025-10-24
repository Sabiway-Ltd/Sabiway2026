// app/(auth)/confirm-signup/page.tsx

import { Suspense } from "react";
import ConfirmSignupClient from "./ConfirmSignupClient";

export default function ConfirmSignupPage() {
  return (
    <Suspense fallback={<div>Confirming your account...</div>}>
      <ConfirmSignupClient />
    </Suspense>
  );
}
