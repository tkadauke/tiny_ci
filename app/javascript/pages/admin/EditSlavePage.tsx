import SlaveForm from "../../components/admin/SlaveForm"
import { PageHeader } from "@/components/ui/PageHeader"
import { useSlave } from "../../hooks/admin/useSlave"
import { useUpdateSlave } from "../../hooks/admin/useUpdateSlave"
import type { Slave } from "../../hooks/admin/useSlaves"

type Props = {
  name: string
}

export default function EditSlavePage({ name }: Props) {
  const { slave, loading, error } = useSlave(name)
  const { updateSlave } = useUpdateSlave(name)

  async function submit(slaveForm: Partial<Slave>) {
    const updated = await updateSlave(slaveForm)
    window.location.assign(`/admin/slaves/${encodeURIComponent(updated.name)}?flash=${encodeURIComponent("Successfully updated slave")}`)
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!slave) return null

  return (
    <>
      <PageHeader title={`Edit Slave ${slave.name}`} />
      <SlaveForm slave={slave} submitLabel="Update" onSubmit={submit} />
    </>
  )
}
