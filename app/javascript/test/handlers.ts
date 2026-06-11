import { http, HttpResponse } from "msw";

const guestUser = {
  guest: true,
  login: null,
  email: null,
  role: "guest",
  initial_admin: false,
  can_configure_slaves: false,
  can_configure_system_variables: false,
  can_create_accounts: false,
  can_create_projects: false,
  can_edit_projects: false,
  can_create_plans: false,
  can_edit_plans: false,
  can_destroy_plans: false,
};

const loggedInUser = {
  guest: false,
  login: "admin",
  email: "admin@example.com",
  role: "admin",
  initial_admin: false,
  can_configure_slaves: true,
  can_configure_system_variables: true,
  can_create_accounts: true,
  can_create_projects: true,
  can_edit_projects: true,
  can_create_plans: true,
  can_edit_plans: true,
  can_destroy_plans: true,
};

const project = {
  id: 1,
  name: "tiny-ci",
  description: "Tiny CI fixture project",
};

const plan = {
  name: "main",
  project_name: project.name,
  project_id: project.name,
  plan_id: "main",
  description: "Main branch",
};

const build = {
  id: 101,
  position: 1,
  status: "success",
  status_icon_path: "/assets/icons/small/success.png",
  created_at: "2026-01-01T00:00:00.000Z",
  finished_at: "2026-01-01T00:03:00.000Z",
  duration: 180,
  starter_login: "admin",
  plan,
  has_children: false,
  children: [],
};

const buildDetail = {
  ...build,
  name: "build 1",
  status_text: "Success",
  revision: "abc123",
  slave: { name: "worker-1" },
  starter_id: 1,
  output_rows: [
    {
      index: 0,
      timestamp: 1_767_225_600,
      command: "npm test",
      line: "Tests passed",
    },
  ],
};

const workers = [
  {
    name: "worker-1",
    hostname: "localhost",
    protocol: "localhost",
    offline: false,
    busy: false,
    capabilities: null,
    max_builds: 1,
    username: null,
    base_path: "/tmp/tiny-ci",
    default_base_path: "/tmp/tiny-ci",
    environment_variables: {},
  },
];

export const handlers = [
  http.get("/api/me", () => HttpResponse.json(guestUser)),
  http.get("/api/dashboard", () =>
    HttpResponse.json({
      queue: [],
      slaves: [{ name: "worker-1", offline: false, running_builds: [] }],
      recent_builds: [build],
    }),
  ),
  http.get("/api/projects", () => HttpResponse.json([project])),
  http.get("/api/projects/:projectId/plans", () => HttpResponse.json([plan])),
  http.get("/api/projects/:projectId/plans/:planId/builds", () => HttpResponse.json([build])),
  http.get("/api/projects/:projectId/plans/:planId/builds/:buildId", () =>
    HttpResponse.json(buildDetail),
  ),
  http.post("/api/session", async ({ request }) => {
    const credentials = await request.json().catch(() => ({}));

    if (
      typeof credentials === "object" &&
      credentials !== null &&
      "login" in credentials &&
      "password" in credentials
    ) {
      return HttpResponse.json(loggedInUser);
    }

    return HttpResponse.json({ errors: ["Invalid login or password"] }, { status: 422 });
  }),
  http.get("/api/csrf", () => HttpResponse.json({ token: "test-csrf-token" })),
  http.get("/api/admin/slaves", () => HttpResponse.json(workers)),
  http.get("/api/help_topics/*", () =>
    HttpResponse.json({
      title: "Help topic",
      html: "<p>Fixture help topic.</p>",
    }),
  ),
];
