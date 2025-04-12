import { useQuery } from "@tanstack/react-query";
import { ActivityFeedItem } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommunityActivityProps {
  showAllButton?: boolean;
  showTitle?: boolean;
}

export default function CommunityActivity({
  showAllButton = true,
  showTitle = true,
}: CommunityActivityProps) {
  // Fetch activity feed
  const { data: activities, isLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ["/api/activity-feed"],
  });

  if (isLoading) {
    return (
      <div>
        {showTitle && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-inter">Community Activity</h2>
            {showAllButton && (
              <a href="#" className="text-primary font-medium text-sm">View All</a>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white rounded-[12px] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Skeleton className="h-5 w-24 mr-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-16 mr-4" />
                      <Skeleton className="h-4 w-16 mr-4" />
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div>
        {showTitle && (
          <div className="mb-4">
            <h2 className="text-xl font-bold font-inter">Community Activity</h2>
          </div>
        )}
        
        <Card className="bg-white rounded-[12px] shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No activity yet in your community.</p>
            <p className="text-gray-500 mt-2">Start completing habits to create activity!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-inter">Community Activity</h2>
          {showAllButton && (
            <a href="#" className="text-primary font-medium text-sm">View All</a>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card 
            key={activity.id}
            className="bg-white rounded-[12px] shadow-sm hover:translate-y-[-2px] transition-transform duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-start">
                <img 
                  src={activity.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.displayName || activity.user.username)}&background=5B5FE3&color=fff`} 
                  alt={activity.user.displayName || activity.user.username} 
                  className="h-10 w-10 rounded-full mr-3 object-cover" 
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="font-medium">{activity.user.displayName || activity.user.username}</p>
                    <p className="text-gray-500 text-sm ml-2">@{activity.user.username}</p>
                  </div>
                  <p className="text-sm mt-1">
                    Completed <span className="font-medium">{activity.habit.title}</span>
                    {activity.streak > 1 && (
                      <span> - Day {activity.streak} streak!</span>
                    )}
                    {activity.streak === 21 && " 🎉"}
                    {activity.streak === 30 && " 🏆"}
                    {activity.streak === 100 && " 💯"}
                    {activity.streak === 365 && " 🔥"}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <span className="mr-4 flex items-center">
                      <HeartIcon className="h-4 w-4 mr-1" /> {Math.floor(Math.random() * 30)}
                    </span>
                    <span className="flex items-center">
                      <MessageCircleIcon className="h-4 w-4 mr-1" /> {Math.floor(Math.random() * 10)}
                    </span>
                    <span className="ml-auto text-xs">
                      {formatDistanceToNow(new Date(activity.completedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
