import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Table, Td, Th, Tr } from "@/components/ui/Table"
import { useCreateSlave } from "../../hooks/admin/useCreateSlave"
import { useSlaves } from "../../hooks/admin/useSlaves"

function statusIcon(offline: boolean) {
  const label = offline ? "Offline" : "Online"
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${offline ? "bg-red-500" : "bg-green-500"}`} aria-hidden="true" />
      {label}
    </span>
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
      <PageHeader title="Listing Slaves" actions={slaves.length > 0 ? <a className="text-sm text-blue-600 hover:text-blue-500" href="/admin/slaves/new">New Slave</a> : null} />

      {slaves.length === 0 ? (
        <Card>
          <CardBody>
          <p>There are no slaves configured yet.</p>
          <p>
            <a href="/admin/slaves/new">Add the first slave</a> <strong>or</strong>
          </p>
          {quickCreateError ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{quickCreateError}</div> : null}
          <form onSubmit={createLocalhost}>
            <input type="hidden" name="name" value="localhost" />
            <input type="hidden" name="protocol" value="localhost" />
            <Button type="submit">Use localhost as the first slave</Button>
          </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
          <Table>
            <thead>
              <tr>
                <Th>Status</Th>
                <Th>Protocol</Th>
                <Th>Name</Th>
                <Th>Hostname</Th>
              </tr>
            </thead>
            <tbody>
              {slaves.map((slave) => (
                <Tr key={slave.name}>
                  <Td>{statusIcon(slave.offline)}</Td>
                  <Td>{slave.protocol}</Td>
                  <Td>
                    <a href={`/admin/slaves/${encodeURIComponent(slave.name)}`}>{slave.name}</a>
                  </Td>
                  <Td>{slave.hostname}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          </CardBody>
        </Card>
      )}
    </>
  )
}
