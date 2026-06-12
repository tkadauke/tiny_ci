import { FormEvent, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"
import { FormField, inputClassName } from "@/components/ui/FormField"
import { Table, Td, Th, Tr } from "@/components/ui/Table"
import type { Slave } from "../../hooks/admin/useSlaves"

type EnvironmentRow = {
  id: string
  key: string
  value: string
}

type Props = {
  slave?: Partial<Slave> | null
  submitLabel: string
  onSubmit: (slave: Partial<Slave>) => Promise<void>
}

const blankSlave: Partial<Slave> = {
  offline: false,
  name: "",
  protocol: "localhost",
  hostname: "",
  username: "",
  password: "",
  base_path: "",
  capabilities: "",
  max_builds: 0,
  environment_variables: {},
}

function environmentRows(slave?: Partial<Slave> | null): EnvironmentRow[] {
  const variables = slave?.environment_variables || {}
  const rows = Object.entries(variables)
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([id, variable]) => ({
      id,
      key: variable?.key || "",
      value: variable?.value || "",
    }))

  rows.push({ id: `new-${rows.length}`, key: "", value: "" })
  return rows
}

function toEnvironmentVariables(rows: EnvironmentRow[]) {
  return rows.reduce<Record<string, { key: string; value: string }>>((variables, row, index) => {
    if (row.key.trim() === "") return variables
    variables[String(index)] = { key: row.key, value: row.value }
    return variables
  }, {})
}

export default function SlaveForm({ slave, submitLabel, onSubmit }: Props) {
  const initialSlave = useMemo(() => ({ ...blankSlave, ...(slave || {}) }), [slave])
  const [form, setForm] = useState<Partial<Slave>>(initialSlave)
  const [rows, setRows] = useState<EnvironmentRow[]>(environmentRows(slave))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initialSlave)
    setRows(environmentRows(slave))
  }, [initialSlave, slave])

  function updateField(name: keyof Slave, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateRow(index: number, field: "key" | "value", value: string) {
    setRows((current) => {
      const next = current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
      const last = next[next.length - 1]
      if (last && (last.key.trim() !== "" || last.value.trim() !== "")) {
        next.push({ id: `new-${next.length}`, key: "", value: "" })
      }
      return next
    })
  }

  function removeRow(index: number) {
    setRows((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index)
      return next.length === 0 || next[next.length - 1].key.trim() !== "" || next[next.length - 1].value.trim() !== ""
        ? [...next, { id: `new-${next.length}`, key: "", value: "" }]
        : next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await onSubmit({
        ...form,
        environment_variables: toEnvironmentVariables(rows),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save slave")
    } finally {
      setSubmitting(false)
    }
  }

  const defaultBasePath = slave?.default_base_path || "the default path"

  return (
    <Card>
      <CardBody>
    <form onSubmit={handleSubmit}>
      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <label className="mb-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          id="slave_offline"
          name="offline"
          type="checkbox"
          checked={Boolean(form.offline)}
          onChange={(event) => updateField("offline", event.currentTarget.checked)}
        />
        Offline
      </label>

      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
      <FormField label="Name">
        <input className={inputClassName} id="slave_name" name="name" type="text" value={form.name || ""} onChange={(event) => updateField("name", event.currentTarget.value)} />
      </FormField>

      <FormField label="Protocol">
        <select className={inputClassName} id="slave_protocol" name="protocol" value={form.protocol || "localhost"} onChange={(event) => updateField("protocol", event.currentTarget.value)}>
          <option value="localhost">localhost</option>
          <option value="ssh">ssh</option>
        </select>
      </FormField>

      <FormField label="Host Name">
        <input className={inputClassName} id="slave_hostname" name="hostname" type="text" value={form.hostname || ""} onChange={(event) => updateField("hostname", event.currentTarget.value)} />
      </FormField>

      <FormField label="User Name">
        <input className={inputClassName} id="slave_username" name="username" type="text" value={form.username || ""} onChange={(event) => updateField("username", event.currentTarget.value)} />
      </FormField>

      <FormField label="Password">
        <input className={inputClassName} id="slave_password" name="password" type="text" value={form.password || ""} onChange={(event) => updateField("password", event.currentTarget.value)} />
      </FormField>

      <FormField label="Base Path">
        <p className="mb-2 text-sm text-gray-500">Leave blank to use the default path {defaultBasePath}</p>
        <input className={inputClassName} id="slave_base_path" name="base_path" type="text" value={form.base_path || ""} onChange={(event) => updateField("base_path", event.currentTarget.value)} />
      </FormField>
      </div>

      <div className="mb-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">Environment Variables</h2>
        <Table>
          <thead>
            <tr>
              <Th>Variable name</Th>
              <Th>Value</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <Tr key={row.id}>
                <Td>
                  <input className={inputClassName} type="text" value={row.key} onChange={(event) => updateRow(index, "key", event.currentTarget.value)} />
                </Td>
                <Td>
                  <input className={inputClassName} type="text" value={row.value} onChange={(event) => updateRow(index, "value", event.currentTarget.value)} />
                </Td>
                <Td>
                  {index < rows.length - 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(index)}>
                      Remove
                    </Button>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      <FormField label="Slave Capabilities">
        <p className="mb-2 text-sm text-gray-500">
          Values are separated by commas. <a href="/help_topics/slaves">Help</a>
        </p>
        <textarea className={inputClassName} id="slave_capabilities" name="capabilities" rows={3} value={form.capabilities || ""} onChange={(event) => updateField("capabilities", event.currentTarget.value)} />
      </FormField>

      <FormField label="Maximum Builds">
        <p className="mb-2 text-sm text-gray-500">0 = unlimited</p>
        <input className={inputClassName} id="slave_max_builds" name="max_builds" type="text" value={form.max_builds ?? 0} onChange={(event) => updateField("max_builds", event.currentTarget.value)} />
      </FormField>

      <Button type="submit" disabled={submitting}>{submitting ? `${submitLabel}...` : submitLabel}</Button>
    </form>
      </CardBody>
    </Card>
  )
}
