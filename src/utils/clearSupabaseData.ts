/**
 * Utilitário para limpar dados do Supabase do localStorage
 * Usado para forçar o uso exclusivo do MongoDB
 */

export const clearSupabaseData = () => {
  try {
    console.log('🧹 Clearing Supabase data from localStorage...');
    
    // Lista de chaves relacionadas ao Supabase que devem ser removidas
    const supabaseKeys = [
      'supabase.auth.token',
      'sb-auth-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.session',
      'sb-session',
      'supabase.user',
      'sb-user',
      'production_orders_cache',
      'supabase_cache',
      'sb_cache'
    ];
    
    // Remover chaves específicas do Supabase
    supabaseKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed ${key} from localStorage`);
      }
    });
    
    // Procurar por outras chaves que contenham 'supabase' ou 'sb-'
    const allKeys = Object.keys(localStorage);
    const additionalSupabaseKeys = allKeys.filter(key => 
      key.toLowerCase().includes('supabase') || 
      key.toLowerCase().includes('sb-') ||
      key.toLowerCase().includes('production_orders')
    );
    
    additionalSupabaseKeys.forEach(key => {
      if (!supabaseKeys.includes(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Removed additional Supabase key: ${key}`);
      }
    });
    
    console.log('🎯 Supabase data cleared successfully');
    
    return {
      success: true,
      clearedKeys: [...supabaseKeys, ...additionalSupabaseKeys].filter(key => 
        allKeys.includes(key)
      )
    };
    
  } catch (error) {
    console.error('❌ Error clearing Supabase data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Força a limpeza completa do cache do navegador relacionado ao Supabase
 */
export const forceSupabaseCacheClear = () => {
  try {
    console.log('🔄 Force clearing Supabase cache...');
    
    // Limpar localStorage
    const localStorageResult = clearSupabaseData();
    
    // Limpar sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    const supabaseSessionKeys = sessionKeys.filter(key => 
      key.toLowerCase().includes('supabase') || 
      key.toLowerCase().includes('sb-') ||
      key.toLowerCase().includes('production_orders')
    );
    
    supabaseSessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`✅ Removed ${key} from sessionStorage`);
    });
    
    console.log('🎯 Complete Supabase cache clear finished');
    
    return {
      success: true,
      localStorage: localStorageResult,
      sessionStorage: {
        clearedKeys: supabaseSessionKeys
      }
    };
    
  } catch (error) {
    console.error('❌ Error in force cache clear:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};