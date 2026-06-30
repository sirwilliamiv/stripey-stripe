import type { ReactNode } from 'react'

interface Props {
  business: ReactNode
  observatory: ReactNode
}

export function SplitLayout({ business, observatory }: Props) {
  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <main className="w-[60%] overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
        {business}
      </main>
      <aside className="w-[40%] overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        {observatory}
      </aside>
    </div>
  )
}
