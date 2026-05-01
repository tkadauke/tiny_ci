# tiny-ci Helm chart

Deploys [tiny_ci](https://github.com/tkadauke/tiny_ci) into a Kubernetes cluster.

The chart provisions:

- The **server** Deployment + Service (web UI, GitHub webhook receiver, Checks API client).
- A Traefik **IngressRoute** for the dashboard and the webhook endpoint.
- A **ConfigMap** with non-secret runtime config (runner namespace, default job resources, cache path).
- A **ServiceAccount** for the server with namespace-scoped RBAC (in the runner namespace) to create/manage build Jobs.
- A **runner namespace** that build Jobs are created into.
- A **PersistentVolumeClaim** for the shared build cache mounted by the server (and runners, once #82 lands).

It deliberately does **not** create the application secret. Provide it out-of-band (sealed-secret, External Secrets, etc.) and point the chart at it via `server.envFromSecretName`.

## Required values

The chart will refuse to render until you set:

- `host` — the public hostname (e.g. `tiny-ci.example.com`). Used by the IngressRoute. Set `ingressRoute.enabled=false` if you bring your own ingress.
- `server.envFromSecretName` — the name of an existing secret in the release namespace with `DATABASE_URL`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_ID`, `WEBHOOK_SECRET`, `SECRET_KEY_BASE`.

## Quick install

```sh
helm install tiny-ci ./chart/tiny-ci \
  --namespace tiny-ci \
  --create-namespace \
  --set host=tiny-ci.example.com \
  --set server.envFromSecretName=tiny-ci-env
```

## Values cheatsheet

| Key | Default | Notes |
| --- | --- | --- |
| `image.repository` | `ghcr.io/tkadauke/tiny-ci` | |
| `image.tag` | `""` (Chart.appVersion) | |
| `host` | `""` | Required when `ingressRoute.enabled=true` |
| `replicaCount` | `1` | Web tier is stateless; bump cautiously while scheduler is in-process |
| `server.port` | `7199` | Container port |
| `server.envFromSecretName` | `""` | Required for real deploys |
| `server.probes.enabled` | `false` | Enable once `/up` is wired up |
| `service.type` / `service.port` | `ClusterIP` / `80` | |
| `ingressRoute.enabled` | `true` | Disable to bring your own ingress |
| `ingressRoute.tls.certResolver` | `""` | Optional ACME resolver name |
| `config.runnerNamespace` | `<release>-runners` | Where build Jobs are created |
| `config.defaultRunnerResources` | `1` CPU / `1Gi` memory | |
| `config.storage.cachePath` | `/var/tiny-ci/cache` | Mount path on server + runners |
| `serviceAccount.create` | `true` | |
| `runnerNamespace.create` | `true` | Set false if managed elsewhere |
| `buildCache.enabled` | `true` | |
| `buildCache.size` | `50Gi` | |
| `buildCache.accessModes` | `["ReadWriteMany"]` | Required so runners and server can both mount |
| `buildCache.storageClass` | `""` (cluster default) | |

See [`values.yaml`](values.yaml) for the full list and inline docs.
