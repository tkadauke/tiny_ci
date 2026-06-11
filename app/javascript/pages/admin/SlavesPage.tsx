import { FormEvent, useState } from "react"
import { useCreateSlave } from "../../hooks/admin/useCreateSlave"
import { useSlaves } from "../../hooks/admin/useSlaves"

function statusIcon(offline: boolean) {
  const status = offline ? "offline" : "online"
  const label = offline ? "Offline" : "Online"
  return (
    <>
      <img src={`/assets/icons/small/${status}.png`} alt="" /> {label}
    </>
  )
}

export default function SlavesPage() {
  const { slaves, loading, error } = useSlaves()
  const { createSlave } = useCreateSlave()
  const [quickCreateError, setQuickCreateError] = useState<string | null>(null)

  async function createLocalhost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuickCreateError(null)

    try {
      const slave = await createSlave({ name: "localhost", protocol: "localhost" })
      window.location.assign(`/admin/slaves/${encodeURIComponent(slave.name)}?flash=${encodeURIComponent("Successfully created slave")}`)
    } catch (err) {
      setQuickCreateError(err instanceof Error ? err.message : "Unable to create slave")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>

  return (
    <>
      <h1>Listing Slaves</h1>

      {slaves.length === 0 ? (
        <>
          <p>There are no slaves configured yet.</p>
          <p>
            <a href="/admin/slaves/new">Add the first slave</a> <strong>or</strong>
          </p>
          {quickCreateError ? <div className="errorExplanation">{quickCreateError}</div> : null}
          <form onSubmit={createLocalhost}>
            <input type="hidden" name="name" value="localhost" />
            <input type="hidden" name="protocol" value="localhost" />
            <input type="submit" value="Use localhost as the first slave" />
          </form>
        </>
      ) : (
        <>
          <table className="list">
            <thead>
              <tr>
                <th>Status</th>
                <th>Protocol</th>
                <th>Name</th>
                <th>Hostname</th>
              </tr>
            </thead>
            <tbody>
              {slaves.map((slave) => (
                <tr key={slave.name}>
                  <td>{statusIcon(slave.offline)}</td>
                  <td>{slave.protocol}</td>
                  <td>
                    <a href={`/admin/slaves/${encodeURIComponent(slave.name)}`}>{slave.name}</a>
                  </td>
                  <td>{slave.hostname}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            <a href="/admin/slaves/new">New Slave</a>
          </p>
        </>
      )}
    </>
  )
}
