import { SignupForm, AuthLayout, SignupSidebar, useSignupPage } from '@/features/auth'

export function SignupPage() {
  const { inviteEmail, inviteName, inviteToken, handleSuccess } = useSignupPage()

  return (
    <AuthLayout sidebar={<SignupSidebar />}>
      <SignupForm
        onSuccess={handleSuccess}
        defaultEmail={inviteEmail}
        defaultName={inviteName}
        inviteToken={inviteToken}
      />
    </AuthLayout>
  )
}
