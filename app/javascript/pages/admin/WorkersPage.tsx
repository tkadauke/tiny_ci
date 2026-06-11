import { FormEvent, useState } from "react"
import { useCreateWorker } from "../../hooks/admin/useCreateWorker"
import { useWorkers } from "../../hooks/admin/useWorkers"

function statusIcon(offline: boolean) {
  const status = offline ? "offline" : "online"
  const label = offline ? "Offline" : "Online"
  return (
    <>
      <img src={`/assets/icons/small/${status}.png`} alt="" /> {label}
    </>
  )
}

export default function WorkersPage() {
  const { workers, loading, error } = useWorkers()
  const { createWorker } = useCreateWorker()
  const [quickCreateError, setQuickCreateError] = useState<string | null>(null)

  async function createLocalhost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuickCreateError(null)

    try {
      const worker = await createWorker({ name: "localhost", protocol: "localhost" })
      window.location.assign(`/admin/workers/${encodeURIComponent(worker.name)}?flash=${encodeURIComponent("Successfully created worker")}`)
    } catch (err) {
      setQuickCreateError(err instanceof Error ? err.message : "Unable to create worker")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>

  return (
    <>
      <h1>Listing Workers</h1>

      {workers.length === 0 ? (
        <>
          <p>There are no workers configured yet.</p>
          <p>
            <a href="/admin/workers/new">Add the first worker</a> <strong>or</strong>
          </p>
          {quickCreateError ? <div className="errorExplanation">{quickCreateError}</div> : null}
          <form onSubmit={createLocalhost}>
            <input type="hidden" name="name" value="localhost" />
            <input type="hidden" name="protocol" value="localhost" />
            <input type="submit" value="Use localhost as the first worker" />
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
              {workers.map((worker) => (
                <tr key={worker.name}>
                  <td>{statusIcon(worker.offline)}</td>
                  <td>{worker.protocol}</td>
                  <td>
                    <a href={`/admin/workers/${encodeURIComponent(worker.name)}`}>{worker.name}</a>
                  </td>
                  <td>{worker.hostname}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            <a href="/admin/workers/new">New Worker</a>
          </p>
        </>
      )}
    </>
  )
}
