"use client"
import * as Tabs from '@radix-ui/react-tabs'
import { DVRControls } from './DVRControls'
import { ApiLogTab } from './tabs/ApiLogTab'
import { WebhooksTab } from './tabs/WebhooksTab'
import { ComplianceTab } from './tabs/ComplianceTab'
import { StoreGuideTab } from './tabs/StoreGuideTab'
import { CertTipsTab } from './tabs/CertTipsTab'
import { StripeObjectTab } from './tabs/StripeObjectTab'
import { ExamTab } from './tabs/ExamTab'

const TABS = [
  { value: 'api-log', label: 'API Log' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'store-guide', label: 'Store Guide' },
  { value: 'cert-tips', label: 'Cert Tips' },
  { value: 'stripe-object', label: 'Stripe Object' },
  { value: 'exam', label: 'Exam' },
]

export function Observatory() {
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      <div className="px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Observatory</span>
      </div>
      <Tabs.Root defaultValue="api-log" className="flex flex-col flex-1 overflow-hidden">
        <Tabs.List className="flex shrink-0 border-b border-zinc-800 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2 text-xs text-zinc-500 whitespace-nowrap border-b-2 border-transparent transition-colors data-[state=active]:text-violet-400 data-[state=active]:border-violet-500 hover:text-zinc-300"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-hidden">
          <Tabs.Content value="api-log" className="h-full overflow-hidden">
            <ApiLogTab />
          </Tabs.Content>
          <Tabs.Content value="webhooks" className="h-full overflow-hidden">
            <WebhooksTab />
          </Tabs.Content>
          <Tabs.Content value="compliance" className="h-full overflow-y-auto">
            <ComplianceTab />
          </Tabs.Content>
          <Tabs.Content value="store-guide" className="h-full overflow-y-auto">
            <StoreGuideTab />
          </Tabs.Content>
          <Tabs.Content value="cert-tips" className="h-full overflow-y-auto">
            <CertTipsTab />
          </Tabs.Content>
          <Tabs.Content value="stripe-object" className="h-full overflow-y-auto">
            <StripeObjectTab />
          </Tabs.Content>
          <Tabs.Content value="exam" className="h-full overflow-y-auto">
            <ExamTab />
          </Tabs.Content>
        </div>

        <DVRControls />
      </Tabs.Root>
    </div>
  )
}
