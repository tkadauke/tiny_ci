import type { ReactNode } from "react"

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`.trim()}>{children}</div>
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="px-6 py-4 border-b border-gray-100 font-medium text-gray-900">{children}</div>
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-6 py-4">{children}</div>
}
