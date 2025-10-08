import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Shield, Eye, Wrench } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'supervisor': return Eye;
      case 'operador': return Wrench;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      case 'supervisor': return 'bg-blue-500 text-white';
      case 'operador': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'operador': return 'Operador';
      default: return 'Usuário';
    }
  };

  const IconComponent = getRoleIcon(user.role || '');

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <img 
            src="/src/assets/motor-plus-logo.png" 
            alt="Motor+ Logo" 
            className="h-8 w-auto"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getRoleColor(user.role || '')}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{user.full_name}</div>
              <Badge variant="secondary" className="text-xs">
                {getRoleLabel(user.role || '')}
              </Badge>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}