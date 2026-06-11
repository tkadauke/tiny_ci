# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@rails/actioncable", to: "@rails--actioncable.js" # @8.1.300
pin "react" # @19.2.7
pin "react-dom/client", to: "react-dom--client.js" # @19.2.7
pin "react-dom" # @19.2.7
pin "scheduler" # @0.27.0
pin "@tanstack/react-query", to: "lib/query.js"
pin_all_from "app/javascript/components", under: "components"
pin_all_from "app/javascript/lib", under: "lib"
pin_all_from "app/javascript/pages", under: "pages"
