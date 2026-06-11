Rails.application.routes.draw do
  namespace :api do
    resource :me, only: :show, controller: "me"
    resource :session, only: [:create, :destroy]
    resources :users, param: :login, only: [:index, :create, :show, :update]
    get "csrf", to: "csrf#token"

    namespace :admin do
      resources :slaves, param: :name
      resource :configuration, only: [] do
        collection do
          get :options
          post "/", to: "configurations#create"
        end
      end
    end

    resource :settings, only: [], controller: "configurations" do
      collection do
        get :options
        post "/", to: "configurations#create"
      end
    end

    get "help_topics/*id", to: "help_topics#show"
  end

  namespace :admin do
    get  "setup",         to: "setup#index",       as: :setup
    post "setup",         to: "setup#create"
    get  "setup/restart", to: "setup#restart",     as: :setup_restart
    get  "setup/redirect", to: "setup#redirect_me", as: :setup_redirect
  end

  namespace :api do
    resources :projects, param: :project_id, only: %i[index create update destroy]

    scope "projects/:project_id" do
      get    "plans",          to: "plans#project_index"
      post   "plans",          to: "plans#create"
      get    "plans/new",      to: "plans#new_form"
      get    "plans/:plan_id", to: "plans#show"
      patch  "plans/:plan_id", to: "plans#update"
      put    "plans/:plan_id", to: "plans#update"
      delete "plans/:plan_id", to: "plans#destroy"

      scope "plans/:plan_id" do
        resources :builds, param: :id, only: %i[index show] do
          member { post :stop }
        end
        post "builds", to: "plans#create_build", as: :create_build
      end
    end

    resources :plans, only: :index
  end

  namespace :api do
    get "dashboard", to: "dashboard#show"
    resources :projects, only: [] do
      resources :plans, only: [] do
        resources :builds, param: :id, only: [:index, :show] do
          member { post :stop }
        end
      end
    end
  end

  get "/signup", to: "react#index", as: :signup

  root to: "react#index"

  get '*path', to: 'react#index',
    constraints: ->(req) { req.format.html? && !req.path.start_with?('/api/', '/cable', '/admin/setup') }
end
