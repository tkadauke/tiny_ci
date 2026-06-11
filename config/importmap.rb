# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "react", to: "https://esm.sh/react@18.2.0"
pin "react-dom/client", to: "https://esm.sh/react-dom@18.2.0/client"
pin "@tanstack/react-query", to: "https://esm.sh/@tanstack/react-query@5.80.7"
pin "lib/api"
pin "lib/flash"
pin "lib/queryClient"
pin "hooks/useCreateUser"
pin "pages/auth/SignupPage"
