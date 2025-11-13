import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PersistentHeader() {
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold">
            10xCards
          </a>
          <nav className="flex gap-4">
            <a href="/create-flashcards" className="text-sm hover:text-primary">
              Create
            </a>
            <a href="/my-flashcards" className="text-sm hover:text-primary">
              My Flashcards
            </a>
            <a href="/my-account" className="text-sm hover:text-primary">
              Account
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
