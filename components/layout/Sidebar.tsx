"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, CheckSquare, Clock, Target, Settings, Sparkles,
  Lightbulb, BookMarked, Briefcase, BookHeart, Salad, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const CORE_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/calendar",   label: "Calendário", icon: CalendarDays },
  { href: "/tasks",      label: "Tarefas",    icon: CheckSquare },
  { href: "/pendencias", label: "Pendências", icon: Clock },
  { href: "/metas",      label: "Metas do Dia",icon: Target },
];

const PESSOAL_ITEMS = [
  { href: "/coach",           label: "Coach IA",        icon: Bot },
  { href: "/insights",        label: "Insights",       icon: Lightbulb },
  { href: "/estudos",         label: "Estudos",         icon: BookMarked },
  { href: "/dieta",           label: "Dieta",           icon: Salad },
  { href: "/espiritualidade", label: "Espiritualidade", icon: BookHeart },
];

const PROFISSIONAL_ITEMS = [
  { href: "/profissional", label: "Projetos", icon: Briefcase },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
        active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
      {label}
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-600" />}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
      <div className="px-6 py-7 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Planner</p>
            <p className="text-xs text-gray-400">da Amanda</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          {CORE_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
        </div>

        <div>
          <p className="px-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Pessoal</p>
          <div className="space-y-1">
            {PESSOAL_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
          </div>
        </div>

        <div>
          <p className="px-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Profissional</p>
          <div className="space-y-1">
            {PROFISSIONAL_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
          </div>
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <NavItem href="/settings" label="Configurações" icon={Settings} />
      </div>
    </aside>
  );
}
