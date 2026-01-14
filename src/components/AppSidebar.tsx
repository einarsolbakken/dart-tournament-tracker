import { useState } from "react";
import { Home, Plus, Target, History, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { title: "Hjem", url: "/", icon: Home },
  { title: "Ny Turnering", url: "/create", icon: Plus },
  { title: "Aktive", url: "/active", icon: Target },
  { title: "Historikk", url: "/history", icon: History },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen z-40
        bg-card border-r border-border/50
        transition-all duration-300 ease-in-out
        flex flex-col
        ${isOpen ? "w-56" : "w-16"}
      `}
    >
      {/* Header */}
      <div className={`h-16 flex items-center border-b border-border/50 ${isOpen ? "px-4 justify-between" : "justify-center"}`}>
        {isOpen && (
          <NavLink to="/">
            <img src={dartArenaLogo} alt="DartArena" className="h-8 w-auto" />
          </NavLink>
        )}
        <button
          onClick={onToggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {isOpen ? (
                <NavLink 
                  to={item.url} 
                  end={item.url === "/"}
                  className="flex items-center gap-3 h-11 px-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  activeClassName="bg-primary/15 text-primary font-medium"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              ) : (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center justify-center h-11 w-full rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      activeClassName="bg-primary/15 text-primary"
                    >
                      <item.icon className="h-5 w-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
