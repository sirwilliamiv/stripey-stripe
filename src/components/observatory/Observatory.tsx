"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DVRControls } from './DVRControls'
import { ApiLogTab } from './tabs/ApiLogTab'
import { WebhooksTab } from './tabs/WebhooksTab'
import { ObjectExplorerTab } from './tabs/ObjectExplorerTab'
import { MoneyFlowTab } from './tabs/MoneyFlowTab'
import { ComplianceTab } from './tabs/ComplianceTab'
import { StoreGuideTab } from './tabs/StoreGuideTab'
import { CertTipsTab } from './tabs/CertTipsTab'

const TABS = [
  { value: 'api', label: 'API Log', component: ApiLogTab },
  { value: 'webhooks', label: 'Webhooks', component: WebhooksTab },
  { value: 'objects', label: 'Objects', component: ObjectExplorerTab },
  { value: 'flow', label: 'Money Flow', component: MoneyFlowTab },
  { value: 'compliance', label: 'Compliance', component: ComplianceTab },
  { value: 'store', label: 'Store Guide', component: StoreGuideTab },
  { value: 'cert', label: 'Cert Tips', component: CertTipsTab },
]

export function Observatory() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Observatory
        </p>
      </div>
      <Tabs defaultValue="api" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="shrink-0 justify-start rounded-none border-b border-zinc-200 bg-transparent px-3 dark:border-zinc-800">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-none border-b-2 border-transparent pb-2 pt-1 text-xs data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1 overflow-y-auto">
          {TABS.map(({ value, component: Tab }) => (
            <TabsContent key={value} value={value} className="m-0 h-full">
              <Tab />
            </TabsContent>
          ))}
        </div>
        <DVRControls />
      </Tabs>
    </div>
  )
}
