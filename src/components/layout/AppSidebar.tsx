import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserRole } from "@/hooks/useAuth";
import {
  BarChart3,
  Factory,
  Calendar,
  Wrench,
  TrendingDown,
  FileText,
  Users,
  Settings,
  Shield,
  Eye,
  Cog,
  Brain
} from "lucide-react"
import { useLocation } from "react-router-dom"

interface AppSidebarProps {
  userRole?: UserRole;
}

// Define menu items based on user roles
const menuItems = {
  admin: [
    {
      title: "Visão Geral",
      items: [
        { title: "Dashboard", url: "/", icon: BarChart3 },
        { title: "Máquinas", url: "/machines", icon: Factory },
        { title: "Planejamento", url: "/planning", icon: Calendar },
        { title: "Produção", url: "/production", icon: Wrench },
        { title: "Perdas", url: "/losses", icon: TrendingDown },
        { title: "Recomendações IA", url: "/recommendations", icon: Brain },
        { title: "Relatórios", url: "/reports", icon: FileText },
      ]
    },
    {
      title: "Administração",
      items: [
        { title: "Usuários", url: "/users", icon: Users },
        { title: "Configurações", url: "/settings", icon: Settings },
      ]
    }
  ],
  supervisor: [
    {
      title: "Operações",
      items: [
        { title: "Dashboard", url: "/", icon: BarChart3 },
        { title: "Máquinas", url: "/machines", icon: Factory },
        { title: "Planejamento", url: "/planning", icon: Calendar },
        { title: "Produção", url: "/production", icon: Wrench },
        { title: "Perdas", url: "/losses", icon: TrendingDown },
        { title: "Recomendações IA", url: "/recommendations", icon: Brain },
        { title: "Relatórios", url: "/reports", icon: FileText },
      ]
    }
  ],
  operador: [
    {
      title: "Operação",
      items: [
        { title: "Dashboard", url: "/", icon: BarChart3 },
        { title: "Máquinas", url: "/machines", icon: Factory },
        { title: "Produção", url: "/production", icon: Wrench },
        { title: "Perdas", url: "/losses", icon: TrendingDown },
        { title: "Recomendações IA", url: "/recommendations", icon: Brain },
      ]
    }
  ]
};

export function AppSidebar({ userRole = 'operador' }: AppSidebarProps) {
  const location = useLocation();
  const userMenuItems = menuItems[userRole] || menuItems.operador;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return Shield;
      case 'supervisor': return Eye;
      case 'operador': return Cog;
      default: return Cog;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'operador': return 'Operador';
      default: return 'Operador';
    }
  };

  const RoleIcon = getRoleIcon(userRole);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold text-sm">Sistema OEE</h2>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RoleIcon className="h-3 w-3" />
                <span>{getRoleLabel(userRole)}</span>
              </div>
            </div>
          </div>
        </div>

        {userMenuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}