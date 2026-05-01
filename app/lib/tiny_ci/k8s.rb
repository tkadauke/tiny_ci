module TinyCI
  # Kubernetes runner — replaces SSH-to-slaves with per-build Jobs in a
  # dedicated runner namespace.
  #
  # This module is the namespace; concrete pieces land slice by slice:
  #
  #   slice 1 (this PR): JobBuilder — pure manifest renderer, no runtime.
  #   slice 2: Runner — creates Jobs via the k8s API, watches pods,
  #            streams logs back into Build#output.
  #   slice 3: Plan opt-in flag + scheduler dispatch (legacy SSH stays
  #            until a project flips to k8s mode).
  #   slice 4: Cache PVC mount + per-project secret env injection (#85).
  #
  # Builds on the chart from #81 which already provisions the runner
  # namespace and ServiceAccount RBAC.
  module K8s
  end
end
