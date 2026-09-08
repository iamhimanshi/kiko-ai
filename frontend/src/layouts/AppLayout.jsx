import Sidebar, { TopBar } from '../components/Sidebar'

export default function AppLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-base flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        {title && <TopBar title={title} />}
        <main className="max-w-6xl mx-auto px-6 sm:px-8 py-8 pb-24 sm:pb-8">{children}</main>
      </div>
    </div>
  )
}
