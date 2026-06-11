import { useState } from "react"
import { useDeleteSlave } from "../../hooks/admin/useDeleteSlave"
import { useSlave } from "../../hooks/admin/useSlave"

type Props = {
  name: string
}

function flashMessage() {
  return new URLSearchParams(window.location.search).get("flash")
}

export default function SlaveShowPage({ name }: Props) {
  const { slave, loading, error } = useSlave(name)
  const { deleteSlave } = useDeleteSlave(name)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const flash = flashMessage()

  async function confirmDelete() {
    setDeleteError(null)

    try {
      await deleteSlave()
      window.location.assign(`/admin/slaves?flash=${encodeURIComponent("Successfully deleted slave")}`)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete slave")
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!slave) return null

  return (
    <>
      {flash ? <div id="flash" className="notice">{flash}</div> : null}
      <h1>Slave {slave.name}</h1>

      <ul className="action-list">
        <li>
          <a href={`/admin/slaves/${encodeURIComponent(slave.name)}/edit`}>Edit</a>
        </li>
        <li>
          <a href={`/admin/slaves/new?clone=${encodeURIComponent(slave.name)}`}>Clone</a>
        </li>
        <li>
          <button type="button" onClick={() => setConfirming(true)}>
            Delete
          </button>
        </li>
      </ul>

      {deleteError ? <div className="errorExplanation">{deleteError}</div> : null}
      {confirming ? (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-slave-heading">
          <h2 id="delete-slave-heading">Delete Slave</h2>
          <p>Do you really want to delete this slave? This operation can not be undone.</p>
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
        <dd>{slave.offline ? "Yes" : "No"}</dd>

        <dt>Protocol</dt>
        <dd>{slave.protocol}</dd>

        <dt>Host name</dt>
        <dd>{slave.hostname || "\u00a0"}</dd>

        <dt>Busy?</dt>
        <dd>{String(slave.busy)}</dd>

        <dt>Capabilities</dt>
        <dd>{slave.capabilities || "\u00a0"}</dd>
      </dl>

      <p>
        <a href="/admin/slaves">Slaves Overview</a>
      </p>
    </>
  )
}
