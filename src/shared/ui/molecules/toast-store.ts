import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  message: string
  type: ToastType
}

export type ToastOptions = {
  durationMs?: number
}

type ToastStore = {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, options?: ToastOptions) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'success', options) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))

    const durationMs = options?.durationMs ?? 3000
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, durationMs)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast(message, 'success', options),
  error: (message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast(message, 'error', options),
  info: (message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast(message, 'info', options),
}
