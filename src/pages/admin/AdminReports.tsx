import { PageHeader } from '../../components/admin'
import { EmptyState } from '../../components/ui'
import { BarChart2 } from 'lucide-react'

export function AdminReports() {
  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader title="التقارير" description="تقارير المبيعات والأداء" />
      <EmptyState icon={<BarChart2 className="h-12 w-12" />} title="قيد التطوير" description="سيتم إضافة تقارير تفصيلية للمبيعات والمنتجات والعملاء في المراحل القادمة" />
    </div>
  )
}