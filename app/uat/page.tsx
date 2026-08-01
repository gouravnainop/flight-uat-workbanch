import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getClientSession } from '@/app/lib/session'
import { API_CATALOG } from '@/app/lib/api-catalog'
import UATExplorer from './UATExplorer'

export const metadata: Metadata = {
  title: 'UAT Explorer — FDCircle',
  robots: { index: false, follow: false },
}

export default async function UATPage() {
  // Authoritative server-side check (proxy.ts does the optimistic check)
  const session = await getClientSession()
  if (!session) redirect('/?unauthorized=1')

  return <UATExplorer catalog={API_CATALOG} />
}
