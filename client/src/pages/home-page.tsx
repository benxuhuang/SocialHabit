import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavBar from "@/components/layout/mobile-nav-bar";
import ProgressOverview from "@/components/dashboard/progress-overview";
import TodaysHabits from "@/components/dashboard/todays-habits";
import CommunityActivity from "@/components/dashboard/community-activity";

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch user stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/user-stats"],
  });

  // Display content based on the active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="p-4 md:p-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold font-inter mb-2">
                Hi, {user?.displayName || user?.username}! 👋
              </h1>
              {isLoadingStats ? (
                <p className="text-gray-500 flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading streak data...
                </p>
              ) : (
                <p className="text-gray-500">
                  {stats?.currentStreak > 0 
                    ? `You're on a ${stats.currentStreak}-day streak! Keep going!`
                    : "Start a new habit streak today!"}
                </p>
              )}
            </div>

            {/* Progress Overview */}
            <ProgressOverview stats={stats} isLoading={isLoadingStats} />

            {/* Today's Habits */}
            <TodaysHabits />

            {/* Community Activity */}
            <CommunityActivity />
          </div>
        );
      case "habits":
        return (
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold font-inter mb-6">My Habits</h1>
            <TodaysHabits showAddButton={true} showTitle={false} />
          </div>
        );
      case "community":
        return (
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold font-inter mb-6">Community</h1>
            <CommunityActivity showAllButton={false} showTitle={false} />
          </div>
        );
      case "stats":
        return (
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold font-inter mb-6">Statistics</h1>
            <p className="text-gray-500">Detailed habit statistics coming soon!</p>
          </div>
        );
      case "settings":
        return (
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold font-inter mb-6">Settings</h1>
            <p className="text-gray-500">Account settings coming soon!</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto h-screen flex flex-col bg-background">
      {/* Mobile Header - Shows on small screens */}
      <MobileHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
