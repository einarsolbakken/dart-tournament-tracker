import { Home, Plus, Target, History, Menu, ChevronLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Hjem", url: "/", icon: Home },
  { title: "Ny Turnering", url: "/create", icon: Plus },
  { title: "Aktive", url: "/active", icon: Target },
  { title: "Historikk", url: "/history", icon: History },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      className={`border-r border-border/50 bg-card transition-all duration-300 ease-in-out ${isCollapsed ? "w-[72px]" : "w-64"}`}
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className={`h-16 flex items-center border-b border-border/50 ${isCollapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        {!isCollapsed && (
          <NavLink to="/" className="flex items-center">
            <img src={dartArenaLogo} alt="DartArena" className="h-9 w-auto" />
          </NavLink>
        )}
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ${isCollapsed ? "" : ""}`}
          aria-label={isCollapsed ? "Åpne meny" : "Lukk meny"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={`py-4 ${isCollapsed ? "px-3" : "px-3"}`}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {isCollapsed ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <NavLink 
                            to={item.url} 
                            end={item.url === "/"}
                            className="flex items-center justify-center w-full h-11 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                            activeClassName="bg-primary/15 text-primary"
                          >
                            <item.icon className="h-5 w-5" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="flex items-center gap-3 w-full h-11 px-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        activeClassName="bg-primary/15 text-primary font-medium"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
