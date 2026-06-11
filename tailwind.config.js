export default {
  content: ['./app/javascript/**/*.{ts,tsx,js,jsx}', './app/views/**/*.erb'],
  theme: {
    extend: {
      colors: {
        // Primary brand - deep blue
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        // Sidebar background
        sidebar: '#0f172a',
        // Status colors
        status: {
          pending: '#94a3b8',
          running: '#3b82f6',
          waiting: '#a78bfa',
          success: '#22c55e',
          failure: '#ef4444',
          error: '#f97316',
          canceled: '#94a3b8',
          stopping: '#fb923c',
          stopped: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: []
}
