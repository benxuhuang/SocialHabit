import { SearchIcon, BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-10 bg-background flex justify-between items-center px-4 py-3 border-b border-border">
      <div className="flex items-center">
        <h1 className="text-xl font-bold font-inter text-primary">SocialHabit</h1>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <SearchIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full"></span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
