import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Save, 
  Database,
  Bell,
  Shield,
  Monitor,
  Target
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

export default function Settings() {
  const { settings, loading, updateMultipleSettings, resetToDefaults } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const { toast } = useToast();

  // Atualizar localSettings quando settings mudar
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveGeneralSettings = async () => {
    try {
      await updateMultipleSettings({
        company_name: localSettings.company_name,
        timezone: localSettings.timezone,
        language: localSettings.language,
        date_format: localSettings.date_format,
        currency: localSettings.currency
      });
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  const handleSaveOeeSettings = async () => {
    try {
      await updateMultipleSettings({
        availability_target: localSettings.availability_target,
        performance_target: localSettings.performance_target,
        quality_target: localSettings.quality_target,
        oee_target: localSettings.oee_target,
        update_interval: localSettings.update_interval,
        auto_calculation: localSettings.auto_calculation
      });
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await updateMultipleSettings({
        email_notifications: localSettings.email_notifications,
        downtime_alerts: localSettings.downtime_alerts,
        low_oee_alerts: localSettings.low_oee_alerts,
        production_target_alerts: localSettings.production_target_alerts,
        loss_threshold_alerts: localSettings.loss_threshold_alerts,
        email_threshold: localSettings.email_threshold
      });
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      await updateMultipleSettings({
        auto_backup: localSettings.auto_backup,
        backup_interval: localSettings.backup_interval,
        data_retention: localSettings.data_retention,
        maintenance_mode: localSettings.maintenance_mode,
        debug_mode: localSettings.debug_mode
      });
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  const handleResetSettings = async () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      try {
        await resetToDefaults();
      } catch (error) {
        // O erro já é tratado no hook
      }
    }
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configurações do Sistema</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as configurações globais e preferências do sistema OEE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground">Sistema v2.1.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={String(localSettings.company_name || '')}
                  onChange={(e) => setLocalSettings(prev => ({...prev, company_name: e.target.value}))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={String(localSettings.timezone || '')} 
                    onValueChange={(value) => setLocalSettings(prev => ({...prev, timezone: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={String(localSettings.language || '')} 
                    onValueChange={(value) => setLocalSettings(prev => ({...prev, language: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="es_ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select 
                    value={String(localSettings.date_format || '')} 
                    onValueChange={(value) => setLocalSettings(prev => ({...prev, date_format: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={String(localSettings.currency || '')} 
                    onValueChange={(value) => setLocalSettings(prev => ({...prev, currency: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveGeneralSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações Gerais
              </Button>
            </CardContent>
          </Card>

          {/* OEE Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Configurações OEE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availabilityTarget">Meta Disponibilidade (%)</Label>
                  <Input
                    id="availabilityTarget"
                    type="number"
                    value={String(localSettings.availability_target || '')}
                    onChange={(e) => setLocalSettings(prev => ({...prev, availability_target: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="performanceTarget">Meta Performance (%)</Label>
                  <Input
                    id="performanceTarget"
                    type="number"
                    value={String(localSettings.performance_target || '')}
                    onChange={(e) => setLocalSettings(prev => ({...prev, performance_target: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualityTarget">Meta Qualidade (%)</Label>
                  <Input
                    id="qualityTarget"
                    type="number"
                    value={String(localSettings.quality_target || '')}
                    onChange={(e) => setLocalSettings(prev => ({...prev, quality_target: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oeeTarget">Meta OEE Geral (%)</Label>
                  <Input
                    id="oeeTarget"
                    type="number"
                    value={String(localSettings.oee_target || '')}
                    onChange={(e) => setLocalSettings(prev => ({...prev, oee_target: e.target.value}))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateInterval">Intervalo de Atualização (segundos)</Label>
                <Select 
                  value={String(localSettings.update_interval || '')} 
                  onValueChange={(value) => setLocalSettings(prev => ({...prev, update_interval: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 segundos</SelectItem>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoCalculation">Cálculo Automático OEE</Label>
                <Switch
                  id="autoCalculation"
                  checked={Boolean(localSettings.auto_calculation)}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, auto_calculation: checked}))}
                />
              </div>

              <Button onClick={handleSaveOeeSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações OEE
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Notificações por Email</Label>
                  <Switch
                    id="emailNotifications"
                    checked={Boolean(localSettings.email_notifications)}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, email_notifications: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="downTimeAlerts">Alertas de Parada</Label>
                  <Switch
                    id="downTimeAlerts"
                    checked={Boolean(localSettings.downtime_alerts)}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, downtime_alerts: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lowOeeAlerts">Alertas de OEE Baixo</Label>
                  <Switch
                    id="lowOeeAlerts"
                    checked={Boolean(localSettings.low_oee_alerts)}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, low_oee_alerts: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="productionTargetAlerts">Alertas de Meta de Produção</Label>
                  <Switch
                    id="productionTargetAlerts"
                    checked={Boolean(localSettings.production_target_alerts)}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, production_target_alerts: checked}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailThreshold">Limite para Alertas (%)</Label>
                  <Input
                    id="emailThreshold"
                    type="number"
                    value={String(localSettings.email_threshold || '')}
                    onChange={(e) => setLocalSettings(prev => ({...prev, email_threshold: e.target.value}))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotificationSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações de Notificação
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoBackup">Backup Automático</Label>
                <Switch
                  id="autoBackup"
                  checked={Boolean(localSettings.auto_backup)}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, auto_backup: checked}))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupInterval">Frequência do Backup</Label>
                <Select 
                  value={String(localSettings.backup_interval || '')} 
                  onValueChange={(value) => setLocalSettings(prev => ({...prev, backup_interval: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  value={String(localSettings.data_retention || '')}
                  onChange={(e) => setLocalSettings(prev => ({...prev, data_retention: e.target.value}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="maintenanceMode">Modo Manutenção</Label>
                <Switch
                  id="maintenanceMode"
                  checked={Boolean(localSettings.maintenance_mode)}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, maintenance_mode: checked}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="debugMode">Modo Debug</Label>
                <Switch
                  id="debugMode"
                  checked={Boolean(localSettings.debug_mode)}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({...prev, debug_mode: checked}))}
                />
              </div>

              <Button onClick={handleSaveSystemSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações do Sistema
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Reset de Configurações</h4>
              <p className="text-sm text-red-600 mb-3">
                Esta ação irá restaurar todas as configurações para os valores padrão de fábrica.
              </p>
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleResetSettings}
              >
                Reset Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}