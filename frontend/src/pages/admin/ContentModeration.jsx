// src/pages/admin/ContentModeration.jsx
import { Flag } from 'lucide-react'
import { EmptyState } from '../../components/shared/DataStates'

export default function ContentModeration() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Content Moderation</h1>
        <p className="text-neutral-500 text-sm mt-1">Reports and automated flags will appear here when moderation APIs are connected.</p>
      </div>

      <div className="flex gap-2">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-violet-600 text-white border-violet-600">
          Open (0)
        </span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white text-neutral-500 border-warm-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
          Resolved (0)
        </span>
      </div>

      <EmptyState
        icon={Flag}
        title="Nothing needs moderation"
        description="When a user report or automated safety flag exists, it will show here with review actions."
      />
    </div>
  )
}
