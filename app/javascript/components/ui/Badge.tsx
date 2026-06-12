const statusStyles: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  running: "bg-blue-100 text-blue-700",
  waiting: "bg-violet-100 text-violet-700",
  success: "bg-green-100 text-green-700",
  failure: "bg-red-100 text-red-700",
  error: "bg-orange-100 text-orange-700",
  stopping: "bg-amber-100 text-amber-700",
  stopped: "bg-gray-100 text-gray-600",
  canceled: "bg-gray-100 text-gray-600",
}

export function StatusBadge({ status, label = status }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status] ?? statusStyles.pending}`}>
      {label}
    </span>
  )
}
