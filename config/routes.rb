Rails.application.routes.draw do
  namespace :admin do
    resources :slaves
    resource :configuration
    get  "setup",         to: "setup#index",       as: :setup
    post "setup",         to: "setup#create"
    get  "setup/restart", to: "setup#restart",     as: :setup_restart
    get  "setup/redirect", to: "setup#redirect_me", as: :setup_redirect
  end

  get "/plans", to: "plans#full_index", as: :all_plans

  resources :projects do
    resources :plans do
      member { get :child }
      resources :builds do
        member { post :stop }
      end
    end
  end

  resources :users
  resource :settings, controller: "configurations"

  get  "/login",  to: "user_sessions#new",     as: :login
  post "/login",  to: "user_sessions#create"
  delete "/logout", to: "user_sessions#destroy", as: :logout

  get "/help_topics",     to: "help_topics#index", as: :help_topics
  get "/help_topics/*id", to: "help_topics#show",  as: :help_topic

  # Public REST API. Bearer-token auth (TINY_CI_API_TOKEN). Versioned so
  # that adding /api/v2 later doesn't break existing CLI / MCP clients.
  namespace :api do
    namespace :v1 do
      post "/projects/:project_id/trigger",         to: "projects#trigger", as: :project_trigger
      get  "/projects/:project_id/builds/:id",      to: "projects#show_build", as: :project_build
    end
  end

  root to: "start#index"
end
