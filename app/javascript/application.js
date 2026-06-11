// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import { renderStoredFlash } from "lib/flash"

function start() {
  renderStoredFlash()
  if (document.getElementById("signup-page-root")) {
    import("pages/auth/SignupPage").then(({ mountSignupPage }) => mountSignupPage())
  }
}

document.addEventListener("DOMContentLoaded", start)
document.addEventListener("turbo:load", start)
