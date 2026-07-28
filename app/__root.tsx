import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router"

import appCss from "./globals.css?url"

import GlobalNav from "@/components/GlobalNav"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "EasyRent",
      },
      {
        name: "description",
        content: "Find affordable houses, apartments, and rental properties in your preferred location with ease.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        // Replace these with your own font classes
        "font-sans",
      )}
    >
      <head>
        <HeadContent />
      </head>

      <body className="min-h-full flex flex-col">
        <Providers>
          <GlobalNav />

          <Outlet />

          <Toaster />
        </Providers>

        <Scripts />
      </body>
    </html>
  )
}
