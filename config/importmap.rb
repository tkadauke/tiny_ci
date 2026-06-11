# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "react", to: "https://esm.sh/react@18.3.1"
pin "react-dom/client", to: "https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1"
pin "react-router-dom", to: "https://esm.sh/react-router-dom@6.30.1?deps=react@18.3.1,react-dom@18.3.1"
pin "@tanstack/react-query", to: "https://esm.sh/@tanstack/react-query@5.80.7?deps=react@18.3.1"
pin "help_topics_app", to: "runtime/help_topics_app.js"
pin "HelpTopicPage", to: "runtime/HelpTopicPage.js"
pin "help_topic_query", to: "runtime/help_topic_query.js"
