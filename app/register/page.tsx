import { RegisterForm } from './_components/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎲 Sports Betting</h1>
          <p className="text-muted-foreground">
            Crie sua conta e comece a controlar suas apostas hoje mesmo
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

