# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "App"
pin "pages/setup/SetupWizardApp"
pin "react", to: "https://esm.sh/react@18.2.0"
pin "react-dom/client", to: "https://esm.sh/react-dom@18.2.0/client"
