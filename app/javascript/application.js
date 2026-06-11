// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import { mountBuildHistoryPage } from "pages/builds/BuildHistoryPage"

function mountReactPages() {
  const buildHistoryPage = document.getElementById("build-history-page")
  if (buildHistoryPage && !buildHistoryPage.dataset.reactMounted) {
    buildHistoryPage.dataset.reactMounted = "true"
    mountBuildHistoryPage(buildHistoryPage)
  }
}

document.addEventListener("turbo:load", mountReactPages)
