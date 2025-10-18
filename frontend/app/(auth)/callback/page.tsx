// app/(auth)/callback/page.tsx (Server Component)
import { Suspense } from "react";
import GoogleCallbackClient from "./GoogleCallbackClient";

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Redirecting...</div>}>
      <GoogleCallbackClient />
    </Suspense>
  );
}
