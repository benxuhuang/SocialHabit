import { User } from "@shared/schema";
import { HomeIcon, CheckSquareIcon, UsersIcon, BarChart3Icon, SettingsIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
}

export default function Sidebar({ activeTab, setActiveTab, user }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <HomeIcon className="h-5 w-5 mr-3" /> },
    { id: "habits", label: "My Habits", icon: <CheckSquareIcon className="h-5 w-5 mr-3" /> },
    { id: "community", label: "Community", icon: <UsersIcon className="h-5 w-5 mr-3" /> },
    { id: "stats", label: "Statistics", icon: <BarChart3Icon className="h-5 w-5 mr-3" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="h-5 w-5 mr-3" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border py-6 px-4">
      <div className="mb-8 px-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold font-inter text-primary">SocialHabit</h1>
        <ThemeToggle />
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-[12px] ${
                  activeTab === item.id
                    ? 'text-primary font-semibold bg-primary bg-opacity-5'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="border-t border-border pt-4 mt-6">
        <div className="flex items-center px-4 py-3">
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.username || '')}&background=5B5FE3&color=fff`} 
            alt={user?.displayName || user?.username || 'User'} 
            className="h-10 w-10 rounded-full mr-3 object-cover" 
          />
          <div>
            <p className="font-medium">{user?.displayName || user?.username}</p>
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
