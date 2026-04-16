import type { PropsWithChildren, ReactNode } from "react";

interface LayoutProps extends PropsWithChildren {
  sidebar: ReactNode;
}

function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto min-w-[1024px] max-w-[1400px] px-8 py-5">
          <h1 className="text-2xl font-bold tracking-tight">
            MORELIFE地球人的个人博客
          </h1>
        </div>
      </header>

      <main className="mx-auto flex h-[calc(100vh-84px)] min-w-[1024px] max-w-[1400px] gap-8 overflow-hidden px-8 py-8">
        <section className="min-w-0 flex-1 overflow-y-auto pr-2">{children}</section>
        <aside className="sticky top-0 h-fit w-80 shrink-0">{sidebar}</aside>
      </main>
    </div>
  );
}

export default Layout;
