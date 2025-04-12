import { User } from "@shared/schema";
import { HomeIcon, CheckSquareIcon, UsersIcon, BarChart3Icon, SettingsIcon } from "lucide-react";

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
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 py-6 px-4">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold font-inter text-primary">SocialHabit</h1>
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
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="flex items-center px-4 py-3">
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.username || '')}&background=5B5FE3&color=fff`} 
            alt={user?.displayName || user?.username || 'User'} 
            className="h-10 w-10 rounded-full mr-3 object-cover" 
          />
          <div>
            <p className="font-medium">{user?.displayName || user?.username}</p>
            <p className="text-sm text-gray-500">@{user?.username}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
