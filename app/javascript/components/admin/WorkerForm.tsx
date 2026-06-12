import { FormEvent, useEffect, useMemo, useState } from "react"
import type { Worker } from "../../hooks/admin/useWorkers"

type EnvironmentRow = {
  id: string
  key: string
  value: string
}

type Props = {
  worker?: Partial<Worker> | null
  submitLabel: string
  onSubmit: (worker: Partial<Worker>) => Promise<void>
}

const blankWorker: Partial<Worker> = {
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

function environmentRows(worker?: Partial<Worker> | null): EnvironmentRow[] {
  const variables = worker?.environment_variables || {}
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

export function WorkerForm({ worker, submitLabel, onSubmit }: Props) {
  const initialWorker = useMemo(() => ({ ...blankWorker, ...(worker || {}) }), [worker])
  const [form, setForm] = useState<Partial<Worker>>(initialWorker)
  const [rows, setRows] = useState<EnvironmentRow[]>(environmentRows(worker))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initialWorker)
    setRows(environmentRows(worker))
  }, [initialWorker, worker])

  function updateField(name: keyof Worker, value: string | boolean) {
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
      setError(err instanceof Error ? err.message : "Unable to save worker")
    } finally {
      setSubmitting(false)
    }
  }

  const defaultBasePath = worker?.default_base_path || "the default path"

  return (
    <form onSubmit={handleSubmit}>
      {error ? <div className="errorExplanation">{error}</div> : null}

      <p className="form_item">
        <input
          id="worker_offline"
          name="offline"
          type="checkbox"
          checked={Boolean(form.offline)}
          onChange={(event) => updateField("offline", event.currentTarget.checked)}
        />{" "}
        <label htmlFor="worker_offline">Offline</label>
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_name">Name</label>
        </span>
        <input id="worker_name" name="name" type="text" value={form.name || ""} onChange={(event) => updateField("name", event.currentTarget.value)} />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_protocol">Protocol</label>
        </span>
        <select id="worker_protocol" name="protocol" value={form.protocol || "localhost"} onChange={(event) => updateField("protocol", event.currentTarget.value)}>
          <option value="localhost">localhost</option>
          <option value="ssh">ssh</option>
        </select>
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_hostname">Host Name</label>
        </span>
        <input id="worker_hostname" name="hostname" type="text" value={form.hostname || ""} onChange={(event) => updateField("hostname", event.currentTarget.value)} />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_username">User Name</label>
        </span>
        <input id="worker_username" name="username" type="text" value={form.username || ""} onChange={(event) => updateField("username", event.currentTarget.value)} />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_password">Password</label>
        </span>
        <input id="worker_password" name="password" type="text" value={form.password || ""} onChange={(event) => updateField("password", event.currentTarget.value)} />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_base_path">Base Path</label>
        </span>
        <span className="desc">Leave blank to use the default path {defaultBasePath}</span>
        <input id="worker_base_path" name="base_path" type="text" value={form.base_path || ""} onChange={(event) => updateField("base_path", event.currentTarget.value)} />
      </p>

      <div className="form_item">
        <span className="label">Environment Variables</span>
        <table>
          <thead>
            <tr>
              <th>Variable name</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>
                  <input type="text" value={row.key} onChange={(event) => updateRow(index, "key", event.currentTarget.value)} />
                </td>
                <td>
                  <input type="text" value={row.value} onChange={(event) => updateRow(index, "value", event.currentTarget.value)} />
                </td>
                <td>
                  {index < rows.length - 1 ? (
                    <button type="button" onClick={() => removeRow(index)}>
                      Remove
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_capabilities">Worker Capabilities</label>
        </span>
        <span className="desc">
          Values are separated by commas. <a href="/help_topics/workers">Help</a>
        </span>
        <textarea id="worker_capabilities" name="capabilities" rows={3} value={form.capabilities || ""} onChange={(event) => updateField("capabilities", event.currentTarget.value)} />
      </p>

      <p className="form_item">
        <span className="label">
          <label htmlFor="worker_max_builds">Maximum Builds</label>
        </span>
        <span className="desc">0 = unlimited</span>
        <input id="worker_max_builds" name="max_builds" type="text" value={form.max_builds ?? 0} onChange={(event) => updateField("max_builds", event.currentTarget.value)} />
      </p>

      <p>
        <input type="submit" value={submitting ? `${submitLabel}...` : submitLabel} disabled={submitting} />
      </p>
    </form>
  )
}

export default WorkerForm
