"use client"
import { TopBar } from '@/components/shell/TopBar'
import { SplitLayout } from '@/components/shell/SplitLayout'
import { ComplianceBorder } from '@/components/shell/ComplianceBorder'
import { FakePaymentFlow } from '@/components/flows/FakePaymentFlow'
import { Observatory } from '@/components/observatory/Observatory'

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <ComplianceBorder>
          <SplitLayout
            left={<FakePaymentFlow />}
            right={<Observatory />}
            leftWidth="45%"
          />
        </ComplianceBorder>
      </main>
    </div>
  )
}
