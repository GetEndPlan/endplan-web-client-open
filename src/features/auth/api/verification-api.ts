import { api } from '@/shared/api'

export type VerificationCodeType = 'email' | 'password_reset' | 'post_release_recovery'

export type SendVerificationRequest = {
  email: string
  type: VerificationCodeType
}

export type VerifyCodeRequest = {
  email: string
  code: string
  type: VerificationCodeType
}

export type SendVerificationResponse = {
  message: string
  expiresIn: number
}

export type VerifyCodeResponse = {
  verified: boolean
  message: string
  userId: string
  type: string
}

export const verificationApi = {
  /**
   * Send a verification code to the user's email
   */
  async sendCode(data: SendVerificationRequest): Promise<SendVerificationResponse> {
    return api.post<SendVerificationResponse>('/api/v1/verification/send', data)
  },

  /**
   * Verify the code entered by the user
   */
  async verifyCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return api.post<VerifyCodeResponse>('/api/v1/verification/verify', data)
  },

  /**
   * Check a password-reset code without consuming it (multi-step reset UI).
   */
  async checkCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return api.post<VerifyCodeResponse>('/api/v1/verification/check', data)
  },

  /**
   * Resend verification code
   */
  async resendCode(data: SendVerificationRequest): Promise<SendVerificationResponse> {
    return api.post<SendVerificationResponse>('/api/v1/verification/resend', data)
  },
}
