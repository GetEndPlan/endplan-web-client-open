import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

type AppBottomBarProps = {
  isSidebarCollapsed?: boolean
}

function optionalHref(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function AppBottomBar({ isSidebarCollapsed = false }: AppBottomBarProps) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  const barItems = [
    { label: t('shell.footer.support'), href: optionalHref(import.meta.env.VITE_SUPPORT_URL) },
    { label: t('shell.footer.terms'), href: optionalHref(import.meta.env.VITE_TERMS_URL) },
    { label: t('shell.footer.privacy'), href: optionalHref(import.meta.env.VITE_PRIVACY_URL) },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href))

  return (
    <footer
      className={`
        fixed bottom-0 left-0 right-0 z-20 hidden h-12 border-t border-ep-border-subtle bg-ep-surface lg:block
        ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64'}
      `}
    >
      <div className="mx-auto flex h-full max-w-7xl 2xl:max-w-[100rem] items-center justify-start gap-1 overflow-x-auto whitespace-nowrap px-4 typo-caption lg:justify-center">
        {barItems.map((item, index) => (
          <Fragment key={item.label}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 text-ep-body/60 transition-colors hover:text-ep-body"
            >
              {item.label}
            </a>
            {index < barItems.length - 1 && <span className="text-ep-border">|</span>}
          </Fragment>
        ))}
        <span className={barItems.length > 0 ? 'pl-3 text-ep-body/50' : 'text-ep-body/50'}>
          {t('shell.footer.copyright', { year })}
        </span>
      </div>
    </footer>
  )
}
