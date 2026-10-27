/**
 * App.jsx — Root Component
 *
 * Phase 2 + Phase 8 Native Hardening:
 * Provider nesting order (outside-in):
 *   ErrorBoundary → NetworkProvider → AuthProvider → ToastProvider → ActionsProvider → UnreadProvider
 *
 * Reason for order:
 *   - ErrorBoundary must be outermost to catch any provider errors
 *   - NetworkProvider before AuthProvider (auth refresh needs network awareness)
 *   - AuthProvider must be before UnreadProvider (unread needs user)
 *   - ToastProvider before ActionsProvider (actions may show toasts in Phase 3)
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ActionsProvider } from './context/ActionsContext'
import { InboxProvider } from './context/InboxContext'
import { UnreadProvider } from './context/UnreadContext'
import { DialogProvider } from './context/DialogContext'
import { NetworkProvider } from './context/NetworkContext'
import { routes } from './routes'
import { setRouterRef } from './lib/legacyGlobals.js'
import { setNativeRouter } from './lib/nativeBridge.js'

const router = createBrowserRouter(routes)

// Expose router to legacyGlobals so window.navigateTo() can push routes
setRouterRef(router)

// Expose router to nativeBridge for hardware back button & deep links
setNativeRouter(router)

export default function App() {
  return (
    <ErrorBoundary>
      <NetworkProvider>
        <AuthProvider>
          <ToastProvider>
            <DialogProvider>
              <InboxProvider>
                <ActionsProvider>
                  <UnreadProvider>
                    <RouterProvider router={router} />
                  </UnreadProvider>
                </ActionsProvider>
              </InboxProvider>
            </DialogProvider>
          </ToastProvider>
        </AuthProvider>
      </NetworkProvider>
    </ErrorBoundary>
  )
}
