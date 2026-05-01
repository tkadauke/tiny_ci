{{/*
Expand the name of the chart.
*/}}
{{- define "tiny-ci.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully qualified app name. Truncated at 63 chars (k8s label/name limit).
*/}}
{{- define "tiny-ci.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Chart label.
*/}}
{{- define "tiny-ci.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Standard labels.
*/}}
{{- define "tiny-ci.labels" -}}
helm.sh/chart: {{ include "tiny-ci.chart" . }}
{{ include "tiny-ci.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels (must remain stable across upgrades — these go into
Deployment.spec.selector, which is immutable).
*/}}
{{- define "tiny-ci.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tiny-ci.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Server ServiceAccount name.
*/}}
{{- define "tiny-ci.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "tiny-ci.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Runner namespace. Defaults to <fullname>-runners; falls back to release
namespace when explicitly set to "".
*/}}
{{- define "tiny-ci.runnerNamespace" -}}
{{- if .Values.config.runnerNamespace -}}
{{- .Values.config.runnerNamespace -}}
{{- else if and (hasKey .Values.config "runnerNamespace") (eq (toString .Values.config.runnerNamespace) "") -}}
{{- printf "%s-runners" (include "tiny-ci.fullname" .) -}}
{{- else -}}
{{- printf "%s-runners" (include "tiny-ci.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
Image reference. Falls back to Chart.appVersion when image.tag is unset so
appVersion bumps don't require a separate values change.
*/}}
{{- define "tiny-ci.image" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- printf "%s:%s" .Values.image.repository $tag -}}
{{- end -}}
