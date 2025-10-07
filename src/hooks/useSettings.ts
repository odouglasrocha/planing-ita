import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemSettings {
  [key: string]: string | boolean | number;
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const defaultSettings = {
    // Configurações Gerais
    company_name: "Empresa Industrial LTDA",
    timezone: "America/Sao_Paulo",
    language: "pt_BR",
    date_format: "DD/MM/YYYY",
    currency: "BRL",
    
    // Configurações OEE
    availability_target: "85",
    performance_target: "90", 
    quality_target: "95",
    oee_target: "80",
    update_interval: "30",
    auto_calculation: true,
    
    // Configurações de Notificação
    email_notifications: true,
    downtime_alerts: true,
    low_oee_alerts: true,
    production_target_alerts: true,
    loss_threshold_alerts: true,
    email_threshold: "70",
    
    // Configurações do Sistema
    auto_backup: true,
    backup_interval: "daily",
    data_retention: "365",
    maintenance_mode: false,
    debug_mode: false
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;
      
      // Converter array de configurações para objeto
      const settingsObj: SystemSettings = { ...defaultSettings };
      
      if (data) {
        data.forEach(setting => {
          let value: any = setting.value;
          
          // Converter strings boolean para boolean
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Tentar converter para número se possível
          else if (!isNaN(Number(value)) && value !== '') value = Number(value);
          
          settingsObj[setting.key] = value;
        });
      }
      
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Usando configurações padrão.",
        variant: "destructive",
      });
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key, 
          value: String(value)
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const updateMultipleSettings = async (newSettings: Record<string, any>) => {
    try {
      const upsertData = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(upsertData, {
          onConflict: 'key'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
      
      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetToDefaults = async () => {
    try {
      // Deletar todas as configurações customizadas
      const { error } = await supabase
        .from('settings')
        .delete()
        .neq('key', ''); // Deleta todas as linhas

      if (error) throw error;

      setSettings(defaultSettings);
      
      toast({
        title: "Configurações resetadas!",
        description: "Todas as configurações foram restauradas para os valores padrão.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Erro ao resetar configurações",
        description: "Não foi possível resetar as configurações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSetting = (key: string) => {
    return settings[key] ?? defaultSettings[key as keyof typeof defaultSettings];
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    getSetting,
    refetch: fetchSettings
  };
}