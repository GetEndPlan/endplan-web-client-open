import { SettingsDataPrivacyPanel } from '@/features/erasure'
import { ExportEndplanCard } from '@/features/endplan'
import { SettingsShell } from './settings-shell'

export function SettingsDataPrivacyPage() {
  return (
    <SettingsShell>
      <SettingsDataPrivacyPanel exportCard={<ExportEndplanCard />} />
    </SettingsShell>
  )
}
