import { useMemo } from "react"
import SlaveForm from "../../components/admin/SlaveForm"
import { useCreateSlave } from "../../hooks/admin/useCreateSlave"
import { useSlave } from "../../hooks/admin/useSlave"
import type { Slave } from "../../hooks/admin/useSlaves"

function cloneName() {
  return new URLSearchParams(window.location.search).get("clone")
}

export default function NewSlavePage() {
  const sourceName = cloneName()
  const { slave, loading, error } = useSlave(sourceName)
  const { createSlave } = useCreateSlave()
  const initialSlave = useMemo<Partial<Slave> | null>(() => (slave ? { ...slave, name: "" } : null), [slave])

  async function submit(slaveForm: Partial<Slave>) {
    const created = await createSlave(slaveForm)
    window.location.assign(`/admin/slaves/${encodeURIComponent(created.name)}?flash=${encodeURIComponent("Successfully created slave")}`)
  }

  if (sourceName && loading) return <p>Loading...</p>
  if (sourceName && error) return <p>{error}</p>

  return (
    <>
      <h1>New Slave</h1>
      <SlaveForm slave={initialSlave} submitLabel="Create" onSubmit={submit} />
    </>
  )
}
