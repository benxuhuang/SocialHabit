import { HomeIcon, CheckSquareIcon, UsersIcon, UserIcon } from "lucide-react";

interface MobileNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MobileNavBar({ activeTab, setActiveTab }: MobileNavBarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <HomeIcon className="h-5 w-5" /> },
    { id: "habits", label: "Habits", icon: <CheckSquareIcon className="h-5 w-5" /> },
    { id: "community", label: "Community", icon: <UsersIcon className="h-5 w-5" /> },
    { id: "settings", label: "Profile", icon: <UserIcon className="h-5 w-5" /> },
  ];

  return (
    <nav className="md:hidden flex items-center justify-around bg-white border-t border-gray-200 py-3 px-4 sticky bottom-0 z-10">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center ${
            activeTab === item.id
              ? 'text-primary font-semibold'
              : 'text-gray-500'
          }`}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
