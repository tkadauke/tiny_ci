import { useState } from "react"
import { useDeleteWorker } from "../../hooks/admin/useDeleteWorker"
import { useWorker } from "../../hooks/admin/useWorker"

type Props = {
  name: string
}

function flashMessage() {
  return new URLSearchParams(window.location.search).get("flash")
}

export default function WorkerShowPage({ name }: Props) {
  const { worker, loading, error } = useWorker(name)
  const { deleteWorker } = useDeleteWorker(name)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const flash = flashMessage()

  async function confirmDelete() {
    setDeleteError(null)

    try {
      await deleteWorker()
      window.location.assign(`/admin/workers?flash=${encodeURIComponent("Successfully deleted worker")}`)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete worker")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!worker) return null

  return (
    <>
      {flash ? <div id="flash" className="notice">{flash}</div> : null}
      <h1>Worker {worker.name}</h1>

      <ul className="action-list">
        <li>
          <a href={`/admin/workers/${encodeURIComponent(worker.name)}/edit`}>Edit</a>
        </li>
        <li>
          <a href={`/admin/workers/new?clone=${encodeURIComponent(worker.name)}`}>Clone</a>
        </li>
        <li>
          <button type="button" onClick={() => setConfirming(true)}>
            Delete
          </button>
        </li>
      </ul>

      {deleteError ? <div className="errorExplanation">{deleteError}</div> : null}
      {confirming ? (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-worker-heading">
          <h2 id="delete-worker-heading">Delete Worker</h2>
          <p>Do you really want to delete this worker? This operation can not be undone.</p>
          <button type="button" onClick={confirmDelete}>
            Delete
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : null}

      <dl>
        <dt>Offline</dt>
        <dd>{worker.offline ? "Yes" : "No"}</dd>

        <dt>Protocol</dt>
        <dd>{worker.protocol}</dd>

        <dt>Host name</dt>
        <dd>{worker.hostname || "\u00a0"}</dd>

        <dt>Busy?</dt>
        <dd>{String(worker.busy)}</dd>

        <dt>Capabilities</dt>
        <dd>{worker.capabilities || "\u00a0"}</dd>
      </dl>

      <p>
        <a href="/admin/workers">Workers Overview</a>
      </p>
    </>
  )
}
