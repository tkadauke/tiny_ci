# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "react", to: "https://esm.sh/react@18.2.0"
pin "react-dom/client", to: "https://esm.sh/react-dom@18.2.0/client"
pin "@tanstack/react-query", to: "https://esm.sh/@tanstack/react-query@5.59.16"
pin "@rails/actioncable", to: "https://esm.sh/@rails/actioncable@7.1.3"
pin_all_from "app/javascript/hooks", under: "hooks"
pin_all_from "app/javascript/lib", under: "lib"
pin_all_from "app/javascript/pages", under: "pages"
