import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react"

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th className={`sticky top-0 z-10 bg-white px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${className}`.trim()} {...props}>
      {children}
    </th>
  )
}

export function Td({ children, className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={`px-4 py-3 text-gray-700 whitespace-nowrap ${className}`.trim()} {...props}>
      {children}
    </td>
  )
}

export function Tr({ children, className = "", ...props }: HTMLAttributes<HTMLTableRowElement> & { children?: ReactNode }) {
  return (
    <tr className={`hover:bg-gray-50 ${className}`.trim()} {...props}>
      {children}
    </tr>
  )
}
