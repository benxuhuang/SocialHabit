import { Card, CardContent } from "@/components/ui/card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressOverviewProps {
  stats?: {
    currentStreak: number;
    todayCompletionRate: number;
    todayCompleted: number;
    todayTotal: number;
    monthlyCompletionRate: number;
    monthlyCompletedDays: number;
    monthlyTotalDays: number;
  };
  isLoading?: boolean;
}

export default function ProgressOverview({ stats, isLoading = false }: ProgressOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white rounded-[12px] shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-8 w-16 mt-1 mb-1" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Today's Progress */}
      <Card className="bg-white rounded-[12px] shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Today's Progress</p>
              <h3 className="text-2xl font-bold font-inter mt-1">
                {stats ? `${stats.todayCompleted}/${stats.todayTotal}` : '0/0'}
              </h3>
              <p className="text-sm text-secondary mt-1">
                {stats ? `${Math.round(stats.todayCompletionRate)}% Complete` : '0% Complete'}
              </p>
            </div>
            <ProgressCircle 
              value={stats?.todayCompletionRate || 0}
              size={64}
              strokeWidth={3}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Current Streak */}
      <Card className="bg-white rounded-[12px] shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
        <CardContent className="p-5">
          <p className="text-gray-500 text-sm">Current Streak</p>
          <div className="flex items-center mt-2">
            <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-full w-10 h-10 flex items-center justify-center mr-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="lucide lucide-flame"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-inter">
                {stats?.currentStreak || 0} {stats?.currentStreak === 1 ? 'Day' : 'Days'}
              </h3>
              <p className="text-sm text-gray-500">
                {stats?.currentStreak ? 'Keep the momentum!' : 'Start a streak today!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Monthly Completion */}
      <Card className="bg-white rounded-[12px] shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
        <CardContent className="p-5">
          <p className="text-gray-500 text-sm">Monthly Completion</p>
          <h3 className="text-2xl font-bold font-inter mt-1">
            {stats ? `${Math.round(stats.monthlyCompletionRate)}%` : '0%'}
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${stats?.monthlyCompletionRate || 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats ? `${stats.monthlyCompletedDays}/${stats.monthlyTotalDays} days completed` : '0/0 days completed'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
