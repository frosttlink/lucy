import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/sidebar"

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
