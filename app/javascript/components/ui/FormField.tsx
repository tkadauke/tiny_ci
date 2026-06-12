import { Children, isValidElement, type ReactNode } from "react"

export const inputClassName =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

export function FormField({ label, error, children }: { label: ReactNode; error?: ReactNode; children: ReactNode }) {
  const inputId = Children.toArray(children).find((child) => isValidElement<{ id?: string }>(child) && child.props.id)
  const htmlFor = isValidElement<{ id?: string }>(inputId) ? inputId.props.id : undefined

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
