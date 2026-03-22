export type SupportCategory =
  | 'account_profile'
  | 'security_password'
  | 'billing'
  | 'bug'
  | 'other'

export type OpenSupportModalOptions = {
  prefillEmail?: string
  source?: string
  categoryDefault?: SupportCategory
}

export const OPEN_SUPPORT_MODAL_EVENT = 'turtleshell:open-support-modal'

export function openSupportModal(options: OpenSupportModalOptions = {}) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<OpenSupportModalOptions>(OPEN_SUPPORT_MODAL_EVENT, {
      detail: options,
    })
  )
}
