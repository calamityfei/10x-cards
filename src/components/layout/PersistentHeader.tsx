import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Menu } from "lucide-react";

export function PersistentHeader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      }
    } catch {
      // Handle error silently or show notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left: Menu & Theme Toggle */}
        <div className="flex flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <NavigationMenu className="hidden md:flex" viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-48 gap-1 p-2">
                    <li>
                      <NavigationMenuLink href="/my-flashcards">My Flashcards</NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="/create-flashcards">Create Flashcards</NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="/study-session">Study Session</NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="/my-account">My Account</NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <ThemeToggle />
        </div>

        {/* Center: Logo */}
        <a href="/my-flashcards" className="text-xl font-bold">
          10xCards
        </a>

        {/* Right: Logout */}
        <div className="flex flex-1 items-center justify-end">
          <Button variant="ghost" onClick={handleLogout} disabled={isLoading} data-testid="logout-button">
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="border-t bg-background px-4 py-2 md:hidden">
          <div className="flex flex-col gap-2">
            <a href="/my-flashcards" className="rounded-md px-3 py-2 text-sm hover:bg-accent">
              My Flashcards
            </a>
            <a href="/create-flashcards" className="rounded-md px-3 py-2 text-sm hover:bg-accent">
              Create Flashcards
            </a>
            <a href="/study-session" className="rounded-md px-3 py-2 text-sm hover:bg-accent">
              Study Session
            </a>
            <a href="/my-account" className="rounded-md px-3 py-2 text-sm hover:bg-accent">
              My Account
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
