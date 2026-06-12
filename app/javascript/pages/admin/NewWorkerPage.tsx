import { useMemo } from "react"
import { WorkerForm } from "../../components/admin/WorkerForm"
import { useCreateWorker } from "../../hooks/admin/useCreateWorker"
import { useWorker } from "../../hooks/admin/useWorker"
import type { Worker } from "../../hooks/admin/useWorkers"

function cloneName() {
  return new URLSearchParams(window.location.search).get("clone")
}

export function NewWorkerPage() {
  const sourceName = cloneName()
  const { worker, loading, error } = useWorker(sourceName)
  const { createWorker } = useCreateWorker()
  const initialWorker = useMemo<Partial<Worker> | null>(() => (worker ? { ...worker, name: "" } : null), [worker])

  async function submit(workerForm: Partial<Worker>) {
    const created = await createWorker(workerForm)
    window.location.assign(`/admin/workers/${encodeURIComponent(created.name)}?flash=${encodeURIComponent("Successfully created worker")}`)
  }

  if (sourceName && loading) return <p>Loading...</p>
  if (sourceName && error) return <p>{error}</p>

  return (
    <>
      <h1>New Worker</h1>
      <WorkerForm worker={initialWorker} submitLabel="Create" onSubmit={submit} />
    </>
  )
}

export default NewWorkerPage
