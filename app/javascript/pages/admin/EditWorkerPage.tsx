import { WorkerForm } from "../../components/admin/WorkerForm"
import { useWorker } from "../../hooks/admin/useWorker"
import { useUpdateWorker } from "../../hooks/admin/useUpdateWorker"
import type { Worker } from "../../hooks/admin/useWorkers"

type Props = {
  name: string
}

export function EditWorkerPage({ name }: Props) {
  const { worker, loading, error } = useWorker(name)
  const { updateWorker } = useUpdateWorker(name)

  async function submit(workerForm: Partial<Worker>) {
    const updated = await updateWorker(workerForm)
    window.location.assign(`/admin/workers/${encodeURIComponent(updated.name)}?flash=${encodeURIComponent("Successfully updated worker")}`)
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!worker) return null

  return (
    <>
      <h1>Edit Worker {worker.name}</h1>
      <WorkerForm worker={worker} submitLabel="Update" onSubmit={submit} />
    </>
  )
}

export default EditWorkerPage
