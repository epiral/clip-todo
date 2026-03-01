export type TabId = "inbox" | "today" | "next" | "projects" | "someday";

interface TabDef {
  id: TabId;
  icon: string;
  label: string;
}

const TABS: TabDef[] = [
  { id: "inbox", icon: "\u{1F4E5}", label: "Inbox" },
  { id: "today", icon: "\u2600\uFE0F", label: "Today" },
  { id: "next", icon: "\u26A1", label: "Next" },
  { id: "projects", icon: "\u{1F4C1}", label: "Projects" },
  { id: "someday", icon: "\u{1F4A4}", label: "Someday" },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
}

export default function TabBar({ active, onChange, badges }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
          {badges?.[tab.id] ? (
            <span className="tab-badge">{badges[tab.id]}</span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
