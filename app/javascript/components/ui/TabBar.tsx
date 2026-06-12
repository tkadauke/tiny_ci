import type { ReactNode } from "react"

export type TabBarItem = {
  key: string
  label: ReactNode
  href?: string
}

export function TabBar({
  items,
  activeKey,
  onSelect,
}: {
  items: TabBarItem[]
  activeKey: string
  onSelect?: (key: string) => void
}) {
  return (
    <div className="mb-4 border-b border-gray-200">
      <nav className="-mb-px flex gap-4" aria-label="Tabs">
        {items.map((item) => {
          const active = item.key === activeKey
          const className = `border-b-2 px-1 py-3 text-sm font-medium ${
            active
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`

          return (
            <a
              key={item.key}
              href={item.href ?? "#"}
              className={className}
              aria-current={active ? "page" : undefined}
              onClick={(event) => {
                if (!onSelect) return
                event.preventDefault()
                onSelect(item.key)
              }}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
