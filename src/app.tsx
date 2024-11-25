import { FileRoutes } from "@solidjs/start/router"
import { Router } from "@solidjs/router"
import { MetaProvider, Title } from "@solidjs/meta"
import { Suspense } from "solid-js"

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidJS + Oauth</Title>
          <Suspense>
            <main class="max-w-5xl mx-auto p-4">{props.children}</main>
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
