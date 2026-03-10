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
}

export default function TabBar({ active, onChange, badges }: Props) {
  return (
    <nav className="flex justify-around items-stretch bg-background border-t border-border shrink-0 pb-[var(--sab)] h-[calc(56px+var(--sab))]">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            className={`flex-1 flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer relative transition-colors border-r border-border last:border-r-0 ${
              isActive ? 'text-foreground bg-surface-hover' : 'text-muted/60 hover:text-foreground hover:bg-surface-hover'
            }`}
            onClick={() => onChange(tab.id)}
          >
            <div className="relative">
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              {badges?.[tab.id] ? (
                <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[9px] font-bold flex items-center justify-center px-1 h-3.5 min-w-[14px]">
                  {badges[tab.id]}
                </span>
              ) : null}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
            {isActive && <div className="absolute top-0 left-0 right-0 h-1 bg-foreground" />}
          </button>
        );
      })}
    </nav>
  );
}
