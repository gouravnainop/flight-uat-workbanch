'use client'

import { PlaneTakeoff } from 'lucide-react'
import { Button } from '@/app/components/ui'

interface EmptyStateProps {
  onOpenSidebar: () => void
}

export default function EmptyState({ onOpenSidebar }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center text-[--color-brand-400]">
        <PlaneTakeoff size={24} strokeWidth={2} />
      </div>
      
      <div className="space-y-1 max-w-sm">
        <h2 className="text-base font-semibold text-[--color-text-primary] tracking-tight">
          Explore UAT APIs
        </h2>
        <p className="text-sm text-[--color-text-muted] leading-relaxed">
          Select an API endpoint from the sidebar to start testing. You can open multiple endpoints in tabs to manage different requests at once.
        </p>
      </div>

      <Button onClick={onOpenSidebar} variant="subtle" className="mt-2">
        Open API Browser
      </Button>
    </div>
  )
}
