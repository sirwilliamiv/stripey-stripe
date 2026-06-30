import { SplitLayout } from '@/components/shell/SplitLayout'
import { Observatory } from '@/components/observatory/Observatory'
import { FakePaymentFlow } from '@/components/fake-flow/FakePaymentFlow'

export default function HomePage() {
  return (
    <SplitLayout
      business={<FakePaymentFlow />}
      observatory={<Observatory />}
    />
  )
}
