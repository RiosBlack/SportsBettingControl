import { LoginForm } from './_components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎲 Sports Betting</h1>
          <p className="text-muted-foreground">
            Controle suas apostas esportivas de forma profissional
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

