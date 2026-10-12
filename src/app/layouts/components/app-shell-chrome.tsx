import { APP_SHELL_HEADER_HEIGHT } from '../app-shell-layout'

/** Desktop-only horizontal header divider (full viewport width). */
export function AppShellChrome() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[45] hidden lg:block" aria-hidden>
      <div
        className="absolute inset-x-0 h-px bg-ep-border-subtle"
        style={{ top: APP_SHELL_HEADER_HEIGHT }}
      />
    </div>
  )
}
