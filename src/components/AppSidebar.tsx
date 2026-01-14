import { Home, Plus, Target, History, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";

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
      className={`border-r border-border bg-card/95 backdrop-blur-sm transition-all duration-300 ${isCollapsed ? "w-16" : "w-60"}`}
      collapsible="icon"
    >
      <SidebarHeader className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <NavLink to="/" className="flex items-center gap-2">
              <img src={dartArenaLogo} alt="DartArena" className="h-8 w-auto" />
            </NavLink>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            aria-label={isCollapsed ? "Åpne meny" : "Lukk meny"}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors ${isCollapsed ? "justify-center" : ""}`}
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
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
