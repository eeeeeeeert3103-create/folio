import { Logo } from "@/components/logo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <form action="/auth/signout" method="post">
            <button className="text-sm text-neutral-500 hover:text-neutral-900">Выйти</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
