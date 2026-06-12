import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
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
      {flash ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash}</div> : null}
      <PageHeader
        title={`Slave ${slave.name}`}
        actions={
          <>
            <a className="text-sm text-blue-600 hover:text-blue-500" href={`/admin/slaves/${encodeURIComponent(slave.name)}/edit`}>Edit</a>
            <a className="text-sm text-blue-600 hover:text-blue-500" href={`/admin/slaves/new?clone=${encodeURIComponent(slave.name)}`}>Clone</a>
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>Delete</Button>
          </>
        }
      />

      {deleteError ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div> : null}
      {confirming ? (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardBody>
        <div role="dialog" aria-modal="true" aria-labelledby="delete-slave-heading">
          <h2 id="delete-slave-heading" className="mb-2 text-base font-semibold text-red-900">Delete Slave</h2>
          <p className="mb-4 text-sm text-red-800">Do you really want to delete this slave? This operation can not be undone.</p>
          <Button type="button" variant="danger" onClick={confirmDelete}>
            Delete
          </Button>{" "}
          <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
        <dt>Offline</dt>
        <dd>{slave.offline ? "Yes" : "No"}</dd>
        </div>

        <div>
        <dt>Protocol</dt>
        <dd>{slave.protocol}</dd>
        </div>

        <div>
        <dt>Host name</dt>
        <dd>{slave.hostname || "\u00a0"}</dd>
        </div>

        <div>
        <dt>Busy?</dt>
        <dd>{String(slave.busy)}</dd>
        </div>

        <div>
        <dt>Capabilities</dt>
        <dd>{slave.capabilities || "\u00a0"}</dd>
        </div>
      </dl>
        </CardBody>
      </Card>

      <p className="mt-4 text-sm">
        <a href="/admin/slaves">Slaves Overview</a>
      </p>
    </>
  )
}
