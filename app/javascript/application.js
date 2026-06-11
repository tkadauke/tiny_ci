// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import { startBuildDetailPage } from "pages/builds/BuildDetailPage"

document.addEventListener("turbo:load", startBuildDetailPage)
document.addEventListener("DOMContentLoaded", startBuildDetailPage)
