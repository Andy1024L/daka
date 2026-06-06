import { Suspense } from "react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}
