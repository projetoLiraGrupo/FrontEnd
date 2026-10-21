import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import {
  applyPreferences,
  readPreferences,
  resolvePreferences,
} from "./preferences"
import "./index.css"

// Resolve theme, contrast, motion and text size before the first render to avoid a flash of the wrong palette.
applyPreferences(resolvePreferences(readPreferences()))

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
