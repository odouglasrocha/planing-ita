import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Shield,
  User,
  Settings,
  Copy,
  Eye,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";

export default function Users() {
  const { 
    users, 
    roles, 
    loading, 
    createUser, 
    deleteUser, 
    getRoleInfo, 
    getRoleStats, 
    getUserInitials 
  } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [newUserData, setNewUserData] = useState({
    full_name: "",
    email: "",
    role: "",
    sector: "",
    shift: ""
  });
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status?: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-gray-500';
  };

  const handleCreateUser = async () => {
    if (!newUserData.full_name || !newUserData.email || !newUserData.role) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, email e função.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createUser(newUserData);
      
      // Se o usuário foi criado com sucesso e tem senha temporária
      if (result && result.temp_password) {
        setTempPassword(result.temp_password);
        setNewUserName(newUserData.full_name);
        setPasswordModalOpen(true);
        setPasswordCopied(false);
      }
      
      setNewUserData({ full_name: "", email: "", role: "", sector: "", shift: "" });
      setNewUserOpen(false);
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setPasswordCopied(true);
      toast({
        title: "Senha copiada!",
        description: "A senha temporária foi copiada para a área de transferência.",
        variant: "default",
      });
      setTimeout(() => setPasswordCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a senha. Tente selecionar e copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      try {
        await deleteUser(userId);
      } catch (error) {
        // O erro já é tratado no hook
      }
    }
  };

  const roleStats = getRoleStats();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Controle acessos e permissões do sistema
            </p>
          </div>
          
          <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Criar Novo Usuário
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João Silva"
                      value={newUserData.full_name}
                      onChange={(e) => setNewUserData(prev => ({...prev, full_name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      placeholder="joao@empresa.com"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função *</Label>
                  <Select value={newUserData.role} onValueChange={(value) => setNewUserData(prev => ({...prev, role: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar função" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Input
                      id="sector"
                      placeholder="Ex: Setor A"
                      value={newUserData.sector}
                      onChange={(e) => setNewUserData(prev => ({...prev, sector: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno</Label>
                    <Select value={newUserData.shift} onValueChange={(value) => setNewUserData(prev => ({...prev, shift: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha">Manhã</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noite">Noite</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setNewUserOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Criar Usuário
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {roleStats.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-4 text-center">
                <div className={`w-10 h-10 ${role.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <p className="font-medium">{role.name}</p>
                <p className="text-2xl font-bold text-primary">{role.count}</p>
                <p className="text-xs text-muted-foreground">usuários</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar usuários..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <div key={user.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex items-start sm:items-center gap-4 w-full lg:w-auto">
                        <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getUserInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h4 className="font-medium truncate">{user.full_name}</h4>
                          <Badge className={`${getStatusColor(user.status)} text-white self-start`}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
                          {roleInfo && (
                            <Badge className={`${roleInfo.color} text-white self-start`}>
                              {roleInfo.name}
                            </Badge>
                          )}
                          {user.sector && (
                            <span className="text-xs text-muted-foreground">
                              {user.sector} • {user.shift}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                        <div className="text-left sm:text-right lg:mr-4 order-2 sm:order-1">
                          <p className="text-sm text-muted-foreground">Último acesso</p>
                          <p className="text-xs text-muted-foreground">
                            {user.last_login || 'Nunca'}
                          </p>
                        </div>
                      
                      <div className="flex gap-2 order-1 sm:order-2">
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <Edit className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Editar</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Permissões por Função
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-4 h-4 ${role.color} rounded-full`} />
                    <h4 className="font-medium">{role.name}</h4>
                  </div>
                  <ul className="space-y-1">
                    {role.permissions.map((permission, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para exibir senha temporária */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Usuário Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              O usuário <strong>{newUserName}</strong> foi criado com sucesso. Aqui está a senha temporária:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Senha Temporária:</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                  className={passwordCopied ? "text-green-600 border-green-600" : ""}
                >
                  {passwordCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-2">
                <code className="text-lg font-mono bg-background px-3 py-2 rounded border block text-center select-all">
                  {tempPassword}
                </code>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Importante:</p>
                  <ul className="text-amber-700 space-y-1">
                    <li>• Esta senha é temporária e deve ser alterada no primeiro login</li>
                    <li>• Compartilhe esta senha de forma segura com o usuário</li>
                    <li>• A senha não será exibida novamente após fechar este modal</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                onClick={() => setPasswordModalOpen(false)}
                className="bg-primary hover:bg-primary/90"
              >
                Entendi, Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}