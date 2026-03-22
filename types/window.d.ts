export {}

declare global {
  interface Window {
    __TS_CONTACT_ENDPOINT?: string
    __TS_APP_VERSION?: string
    showToast?: (message: string) => void
  }
}
