# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@rails/actioncable", to: "@rails--actioncable.js" # @8.1.300
pin "@tanstack/react-query", to: "@tanstack--react-query.js" # @5.101.0
pin "react" # @19.2.7
pin "react-dom" # @19.2.7
pin "react-dom/client", to: "react-dom--client.js" # @19.2.7
pin "@tanstack/query-core", to: "@tanstack--query-core.js" # @5.101.0
pin "react/jsx-runtime", to: "react--jsx-runtime.js" # @19.2.7
pin_all_from "app/javascript/components", under: "components"
pin_all_from "app/javascript/hooks", under: "hooks"
pin_all_from "app/javascript/pages", under: "pages"
pin "scheduler" # @0.27.0
