# Guia de Deploy para Produção - Fábrica ITA

## 🚀 Configuração para https://planing-ita.com/

### 1. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no servidor de produção:

```bash
NODE_ENV=production
VITE_API_URL=https://planing-ita.com
VITE_FRONTEND_URL=https://planing-ita.com
CORS_ORIGIN=https://planing-ita.com
```

### 2. Scripts de Deploy

```bash
# Build para produção
npm run build:prod

# Iniciar servidor de produção
npm run server:prod

# Deploy completo (build + start)
npm run deploy
```

### 3. Configurações CORS

O servidor está configurado para aceitar requisições de:
- `https://planing-ita.com`
- `https://www.planing-ita.com`

### 4. Configurações de Segurança

- Rate limiting habilitado (5 tentativas de auth por 15min em produção)
- Helmet configurado com CSP
- JWT com expiração de 24h em produção
- HTTPS obrigatório em produção

### 5. Estrutura de Arquivos

```
dist/                 # Build de produção do frontend
server.js            # Servidor Express com APIs
.env.production      # Variáveis de ambiente para produção
```

### 6. Comandos de Verificação

```bash
# Verificar se o servidor está rodando
curl https://planing-ita.com/health

# Testar CORS
curl -H "Origin: https://planing-ita.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://planing-ita.com/api/auth/login
```

### 7. Monitoramento

- Logs do servidor incluem informações sobre CORS
- Rate limiting é logado automaticamente
- Erros de autenticação são registrados

### 8. Troubleshooting

**Problema: CORS Error**
- Verifique se o domínio está na lista de origens permitidas
- Confirme se NODE_ENV=production está definido
- Verifique os logs do servidor para mensagens de CORS bloqueado

**Problema: 500 Internal Server Error**
- Verifique se todas as variáveis de ambiente estão definidas
- Confirme a conexão com MongoDB
- Verifique os logs do servidor

**Problema: JWT Invalid**
- Verifique se JWT_SECRET está definido
- Confirme se o token não expirou (24h em produção)