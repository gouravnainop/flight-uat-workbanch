import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/app/lib/session'
import IntegrateExplorer from './IntegrateExplorer'

export const metadata: Metadata = {
  title: 'Integration Workbench — FDCircle',
  description: 'Tools for integrating external flight booking APIs into the FDCircle platform.',
  robots: { index: false, follow: false },
}

export default async function IntegratePage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin/login?from=/integrate')
  }

  return <IntegrateExplorer adminEmail={session.email} />
}

