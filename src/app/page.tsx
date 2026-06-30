import { SplitLayout } from '@/components/shell/SplitLayout'
import { FakePaymentFlow } from '@/components/flows/FakePaymentFlow'
import { Observatory } from '@/components/observatory/Observatory'

export default function Home() {
  return (
    <SplitLayout
      business={<FakePaymentFlow />}
      observatory={<Observatory />}
    />
  )
}
