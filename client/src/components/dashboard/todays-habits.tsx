import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HabitWithStreak } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusIcon, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

interface TodaysHabitsProps {
  showAddButton?: boolean;
  showTitle?: boolean;
}

const habitFormSchema = z.object({
  title: z.string().min(3, {
    message: "Habit title must be at least 3 characters.",
  }),
  description: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

export default function TodaysHabits({ 
  showAddButton = true, 
  showTitle = true 
}: TodaysHabitsProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Fetch habits with completion status
  const { data: habits, isLoading } = useQuery<HabitWithStreak[]>({
    queryKey: ["/api/habits"],
  });

  // Form for adding new habits
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Mutation for adding a habit
  const addHabitMutation = useMutation({
    mutationFn: async (values: HabitFormValues) => {
      const res = await apiRequest("POST", "/api/habits", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Habit created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for toggling habit completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const res = await apiRequest("POST", "/api/habit-completions", { habitId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-feed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a habit
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      await apiRequest("DELETE", `/api/habits/${habitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "Success",
        description: "Habit deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete habit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: HabitFormValues) => {
    addHabitMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        {showTitle && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-inter">Today's Habits</h2>
            {showAddButton && (
              <Button variant="ghost" className="text-primary">
                <PlusIcon className="h-4 w-4 mr-1" /> Add New
              </Button>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-white rounded-[12px] shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-36 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {showTitle && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-inter">Today's Habits</h2>
          {showAddButton && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-primary flex items-center">
                  <PlusIcon className="h-4 w-4 mr-1" /> Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Habit</DialogTitle>
                  <DialogDescription>
                    Create a new habit to track daily. What would you like to improve?
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Habit Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Morning meditation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add details about your habit" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={addHabitMutation.isPending}
                      >
                        {addHabitMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Habit"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {habits && habits.length > 0 ? (
          habits.map((habit) => (
            <Card 
              key={habit.id} 
              className="bg-white rounded-[12px] shadow-sm hover:translate-y-[-2px] transition-transform duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <button 
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${habit.isCompleted 
                        ? 'border-secondary bg-secondary text-white' 
                        : 'border-gray-300 bg-white'}`}
                    onClick={() => toggleCompletionMutation.mutate(habit.id)}
                    disabled={toggleCompletionMutation.isPending}
                  >
                    {habit.isCompleted && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div className="ml-4 flex-1">
                    <p className={`font-medium ${habit.isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {habit.title}
                    </p>
                    {habit.description && (
                      <p className="text-sm text-gray-500">{habit.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <div 
                      className={`${
                        habit.isCompleted 
                          ? 'bg-gradient-to-r from-primary to-primary-light text-white' 
                          : 'bg-gray-200 text-gray-500'
                      } rounded-full text-xs px-2 py-1 flex items-center`}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="mr-1"
                      >
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </svg>
                      <span>{habit.streak}</span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-destructive ml-1"
                      onClick={() => deleteHabitMutation.mutate(habit.id)}
                      disabled={deleteHabitMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="bg-white rounded-[12px] shadow-sm p-6 text-center">
            <p className="text-gray-500 mb-4">You haven't added any habits yet</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Your First Habit</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Habit</DialogTitle>
                  <DialogDescription>
                    Create a new habit to track daily. What would you like to improve?
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Habit Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Morning meditation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add details about your habit" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={addHabitMutation.isPending}
                      >
                        {addHabitMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Habit"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
