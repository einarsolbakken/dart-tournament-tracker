import { Home, Plus, Target, History } from "lucide-react";
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
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Hjem", url: "/", icon: Home },
  { title: "Ny Turnering", url: "/create", icon: Plus },
  { title: "Aktive", url: "/active", icon: Target },
  { title: "Historikk", url: "/history", icon: History },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border bg-card/50 backdrop-blur-sm">
      <SidebarHeader className="p-4 border-b border-border">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={dartArenaLogo} alt="DartArena" className="h-10 w-auto" />
        </NavLink>
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
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
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
