import { Inbox, Sun, Zap, FolderOpen, ClipboardList } from 'lucide-react';

export type TabId = 'inbox' | 'today' | 'next' | 'projects' | 'logbook';

interface TabDef {
  id: TabId;
  icon: typeof Inbox;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'inbox', icon: Inbox, label: 'Inbox' },
  { id: 'today', icon: Sun, label: 'Today' },
  { id: 'next', icon: Zap, label: 'Next' },
  { id: 'projects', icon: FolderOpen, label: 'Projects' },
  { id: 'logbook', icon: ClipboardList, label: 'Logbook' },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
  className?: string;
}

export default function TabBar({ active, onChange, badges, className = '' }: Props) {
  return (
    <nav className={`flex flex-row md:flex-col justify-around md:justify-start items-stretch bg-background border-t md:border-t-0 md:border-r border-border shrink-0 pb-[var(--sab)] md:pb-0 h-[calc(56px+var(--sab))] md:h-full md:w-[240px] md:pt-12 ${className}`}>
      {/* Brand logo/header on Desktop */}
      <div className="hidden md:block px-6 mb-8">
        <h2 className="text-xl font-serif font-bold tracking-wider uppercase text-foreground/85">PINIX // TODO</h2>
        <div className="h-[1px] bg-border mt-3 w-full" />
      </div>

      <div className="flex flex-row md:flex-col flex-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex-1 md:flex-initial flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 bg-transparent border-none cursor-pointer relative transition-colors border-r md:border-r-0 md:border-b border-border last:border-r-0 md:last:border-b-0 px-2 md:px-6 md:py-4 h-full md:h-auto ${
                isActive ? 'text-foreground bg-surface-hover' : 'text-muted/60 hover:text-foreground hover:bg-surface-hover'
              }`}
              onClick={() => onChange(tab.id)}
            >
              {/* Mobile layout */}
              <div className="md:hidden relative flex items-center justify-center">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                {badges?.[tab.id] ? (
                  <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[9px] font-bold flex items-center justify-center px-1 h-3.5 min-w-[14px]">
                    {badges[tab.id]}
                  </span>
                ) : null}
              </div>
              <span className="md:hidden text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">
                {tab.label}
              </span>

              {/* Desktop layout */}
              <div className="hidden md:flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-65'}`}>
                    {tab.label}
                  </span>
                </div>
                {badges?.[tab.id] ? (
                  <span className="bg-foreground text-background text-[10px] font-mono font-bold flex items-center justify-center px-1.5 h-4 min-w-[16px]">
                    {badges[tab.id]}
                  </span>
                ) : null}
              </div>

              {isActive && (
                <div className="absolute top-0 left-0 bg-foreground md:bottom-0 md:w-1 md:h-full h-1 w-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
