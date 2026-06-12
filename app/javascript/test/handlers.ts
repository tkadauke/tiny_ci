import { http, HttpResponse } from "msw";

export const guestUser = {
  guest: true,
  locale: "en",
  login: null,
  email: null,
  role: "guest",
  initial_admin: false,
  can_configure_workers: false,
  can_configure_system_variables: false,
  can_create_accounts: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_create_plans: false,
  can_edit_plans: false,
  can_destroy_plans: false,
};

export const adminUser = {
  guest: false,
  locale: "en",
  login: "admin",
  email: "admin@example.test",
  role: "admin",
  initial_admin: false,
  can_configure_workers: true,
  can_configure_system_variables: true,
  can_create_accounts: true,
  can_create_projects: true,
  can_edit_projects: true,
  can_create_plans: true,
  can_edit_plans: true,
  can_destroy_plans: true,
} as const;

export const normalUser = {
  ...adminUser,
  login: "jane",
  email: "jane@example.test",
  role: "user",
  can_configure_workers: false,
  can_configure_system_variables: false,
  can_create_accounts: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_create_plans: false,
  can_edit_plans: false,
  can_destroy_plans: false,
} as const;

export const planFixture = {
  id: 10,
  name: "main",
  description: "Builds the main branch",
  status: "success",
  weather: 4,
  project: { id: 1, name: "tiny-ci" },
  last_build_time: 90,
  last_build_at: "2026-06-10T12:00:00Z",
  last_success_at: "2026-06-10T12:05:00Z",
  last_failure_at: null,
  previous_plan: null,
  next_plan: null,
  parent: null,
  children_count: 1,
  repository_url: "git@example.test:tiny-ci.git",
  steps: "bundle exec rake",
  requirements: "ruby",
  commit_hook_url: "https://example.test/hook",
  children: [
    {
      id: 11,
      name: "child",
      description: "Child plan",
      status: "failure",
      weather: 2,
      project: { id: 1, name: "tiny-ci" },
      last_build_at: "2026-06-09T12:00:00Z",
      last_success_at: null,
      last_failure_at: "2026-06-09T12:10:00Z",
      previous_plan: null,
      next_plan: null,
      parent: { id: 10, name: "main" },
      children_count: 0,
    },
  ],
  last_finished_build: { position: 7, status: "success" },
  can_edit_plan: true,
  can_create_plans: true,
  can_destroy_plan: true,
  can_edit_plans: true,
  root_plan_options: [
    { id: 10, name: "main" },
    { id: 12, name: "release" },
  ],
  parent_id: null,
  previous_plan_id: null,
};

export const buildFixture = {
  id: 100,
  name: "main",
  position: 7,
  status: "success",
  status_text: "Success",
  status_icon_path: "/assets/icons/small/success.png",
  created_at: "2026-06-10T12:00:00Z",
  finished_at: "2026-06-10T12:02:00Z",
  duration: 120,
  revision: "abc123",
  starter_id: 1,
  starter_login: "admin",
  worker: { name: "builder-1" },
  plan: {
    name: "main",
    project_name: "tiny-ci",
    project_id: "tiny-ci",
    plan_id: "main",
  },
  has_children: false,
  children: [],
  output_rows: [
    { index: 0, timestamp: 1, command: "bundle exec rake", line: "Running tests" },
    { index: 1, timestamp: 2, command: "bundle exec rake", line: "Finished" },
  ],
};

export const workerFixture = {
  name: "builder-1",
  hostname: "builder.local",
  protocol: "ssh",
  offline: false,
  busy: false,
  capabilities: "ruby,node",
  max_builds: 2,
  username: "deploy",
  password: "",
  base_path: "/var/tiny-ci",
  default_base_path: "/tmp/tiny-ci",
  environment_variables: { "0": { key: "RAILS_ENV", value: "test" } },
};

export const usersFixture = [
  { login: "admin", email: "admin@example.test", role: "admin" },
  { login: "jane", email: "jane@example.test", role: "user" },
];

export const projectFixture = {
  id: 1,
  name: "tiny-ci",
  description: "Tiny CI fixture project",
};

export const configOptionsFixture = [
  {
    key: "site_name",
    name: "Site name",
    description: "Displayed application name",
    type: "String",
    current_value: "Tiny CI",
  },
  {
    key: "locale",
    name: "Locale",
    description: null,
    type: "String",
    values: ["en", "de"],
    current_value: "en",
  },
];

export const handlers = [
  http.get("/api/csrf", () => HttpResponse.json({ token: "test-csrf" })),
  http.get("/api/me", () => HttpResponse.json(guestUser)),
  http.post("/api/session", async ({ request }) => {
    const credentials = await request.json().catch(() => ({}));

    if (
      typeof credentials === "object" &&
      credentials !== null &&
      "login" in credentials &&
      "password" in credentials
    ) {
      return HttpResponse.json(adminUser);
    }

    return HttpResponse.json({ errors: ["Invalid login or password"] }, { status: 422 });
  }),
  http.get("/api/dashboard", () =>
    HttpResponse.json({
      queue: [{ ...buildFixture, id: 101, position: 8, status: "pending" }],
      workers: [{ name: "builder-1", offline: false, running_builds: [{ ...buildFixture, status: "running" }] }],
      recent_builds: [buildFixture],
    }),
  ),
  http.post("/api/projects/:projectId/plans/:planId/builds/:buildId/stop", () => new HttpResponse(null, { status: 204 })),
  http.get("/api/projects", () => HttpResponse.json([projectFixture])),
  http.get("/api/plans", () => HttpResponse.json([planFixture, { ...planFixture, id: 12, name: "release", weather: 5 }])),
  http.get("/api/projects/:projectId/plans", () => HttpResponse.json([planFixture])),
  http.get("/api/projects/:projectId/plans/new", () =>
    HttpResponse.json({ plan: {}, can_edit_plans: true, root_plan_options: planFixture.root_plan_options }),
  ),
  http.post("/api/projects/:projectId/plans", async () => HttpResponse.json({ name: "new-plan", project: { id: 1, name: "tiny-ci" } })),
  http.get("/api/projects/:projectId/plans/:planId", () => HttpResponse.json(planFixture)),
  http.patch("/api/projects/:projectId/plans/:planId", () => HttpResponse.json(planFixture)),
  http.post("/api/projects/:projectId/plans/:planId/builds", () => HttpResponse.json({ build: { position: 9 } })),
  http.get("/api/projects/:projectId/plans/:planId/builds", () => HttpResponse.json([buildFixture])),
  http.get("/api/projects/:projectId/plans/:planId/builds/:buildId", () => HttpResponse.json(buildFixture)),
  http.get("/api/users", () => HttpResponse.json(usersFixture)),
  http.post("/api/users", () => HttpResponse.json({ login: "new-user" }, { status: 201 })),
  http.get("/api/users/:login", ({ params }) =>
    HttpResponse.json(usersFixture.find((user) => user.login === params.login) ?? usersFixture[1]),
  ),
  http.patch("/api/users/:login", async ({ request, params }) => {
    const body = (await request.json()) as { user?: { email?: string; role?: string } };
    return HttpResponse.json({ login: params.login, email: body.user?.email ?? "updated@example.test", role: body.user?.role ?? "user" });
  }),
  http.get("/api/admin/workers", () => HttpResponse.json([workerFixture])),
  http.post("/api/admin/workers", () => HttpResponse.json({ ...workerFixture, name: "new-builder" }, { status: 201 })),
  http.get("/api/admin/workers/:name", () => HttpResponse.json(workerFixture)),
  http.patch("/api/admin/workers/:name", () => HttpResponse.json(workerFixture)),
  http.delete("/api/admin/workers/:name", () => new HttpResponse(null, { status: 204 })),
  http.get("/api/admin/configuration/options", () => HttpResponse.json(configOptionsFixture)),
  http.post("/api/admin/configuration", () => new HttpResponse(null, { status: 204 })),
  http.get("/api/settings/options", () => HttpResponse.json(configOptionsFixture)),
  http.post("/api/settings", () => new HttpResponse(null, { status: 204 })),
  http.get("/api/help_topics/*", () =>
    HttpResponse.json({
      title: "Help topic",
      html: "<p>Fixture help topic.</p>",
    }),
  ),
];
