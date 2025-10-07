# Segurança - Sistema de Gerenciamento de Máquinas

## Visão Geral

Este documento descreve as medidas de segurança implementadas no sistema de gerenciamento de máquinas, incluindo autenticação JWT, proteção de API routes e boas práticas de segurança.

## Autenticação JWT

### Implementação
- **Token JWT**: Utilizado para autenticação de usuários
- **Expiração**: Tokens expiram em 7 dias (configurável via `JWT_EXPIRES_IN`)
- **Secret**: Chave secreta forte armazenada em variável de ambiente (`JWT_SECRET`)

### Middleware de Autenticação
```javascript
// Middleware verifyToken protege todas as rotas de máquinas
app.use('/api/machines', verifyToken);
```

### Fluxo de Autenticação
1. Usuário faz login com credenciais válidas
2. Sistema gera token JWT assinado
3. Token é armazenado no localStorage do cliente
4. Todas as requisições incluem o token no header `Authorization: Bearer <token>`
5. Servidor valida o token em cada requisição

## Proteção de API Routes

### Rotas Protegidas
Todas as rotas de gerenciamento de máquinas estão protegidas:
- `GET /api/machines` - Listar máquinas
- `GET /api/machines/:id` - Obter máquina específica
- `POST /api/machines` - Criar nova máquina
- `PUT /api/machines/:id` - Atualizar máquina
- `DELETE /api/machines/:id` - Deletar máquina
- `GET /api/machines/status/:status` - Filtrar por status
- `GET /api/machines/search/:query` - Buscar máquinas

### Validação de Dados
- **express-validator**: Validação de entrada em todas as rotas
- **Sanitização**: Dados são sanitizados antes do processamento
- **Validação de tipos**: Verificação de tipos de dados obrigatórios

## Rate Limiting

### Configuração
- **Janela de tempo**: 15 minutos (900.000ms)
- **Máximo de requisições**: 100 por IP por janela
- **Aplicado globalmente**: Todas as rotas são limitadas

### Implementação
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
});
```

## Headers de Segurança

### Helmet.js
Implementado para adicionar headers de segurança:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)

## CORS (Cross-Origin Resource Sharing)

### Configuração
- **Origem permitida**: `http://localhost:5173` (desenvolvimento)
- **Métodos**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credenciais**: Permitidas para autenticação

## Validação de Entrada

### Middleware validateMachine
```javascript
const validateMachine = [
  body('name').trim().isLength({ min: 1 }).withMessage('Nome é obrigatório'),
  body('code').trim().isLength({ min: 1 }).withMessage('Código é obrigatório'),
  body('status').isIn(['ativa', 'inativa', 'manutenção']).withMessage('Status inválido')
];
```

### Sanitização
- **Trim**: Remove espaços em branco
- **Escape**: Previne XSS em campos de texto
- **Validação de tipos**: Garante tipos corretos de dados

## Tratamento de Erros

### Respostas Padronizadas
```javascript
// Sucesso
{ success: true, data: result }

// Erro
{ success: false, error: "Mensagem de erro" }
```

### Logs de Segurança
- **Tentativas de login**: Registradas no console
- **Tokens inválidos**: Logados para monitoramento
- **Erros de validação**: Registrados para auditoria

## Boas Práticas Implementadas

### 1. Princípio do Menor Privilégio
- Usuários só acessam recursos necessários
- Tokens têm escopo limitado

### 2. Validação Dupla
- Validação no frontend (UX)
- Validação no backend (segurança)

### 3. Não Exposição de Dados Sensíveis
- Senhas hasheadas com bcrypt
- Secrets em variáveis de ambiente
- Tokens não expostos em logs

### 4. Timeout de Sessão
- Tokens expiram automaticamente
- Renovação necessária após expiração

## Configuração de Ambiente

### Variáveis Obrigatórias
```env
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Produção
- Use HTTPS sempre
- Configure JWT_SECRET com pelo menos 256 bits
- Monitore logs de segurança
- Configure rate limiting adequado para sua carga

## Monitoramento e Auditoria

### Logs Implementados
- ✅ Autenticação de usuários
- ✅ Logout de usuários
- ✅ Operações CRUD em máquinas
- ✅ Tentativas de acesso não autorizado

### Métricas de Segurança
- Taxa de tentativas de login falhadas
- Uso de tokens expirados
- Violações de rate limiting

## Próximos Passos

### Melhorias Recomendadas
1. **Refresh Tokens**: Implementar tokens de renovação
2. **2FA**: Autenticação de dois fatores
3. **Audit Log**: Log detalhado de todas as operações
4. **IP Whitelist**: Lista de IPs permitidos
5. **Session Management**: Gerenciamento avançado de sessões

### Testes de Segurança
1. **Penetration Testing**: Testes de penetração
2. **Vulnerability Scanning**: Varredura de vulnerabilidades
3. **Load Testing**: Testes de carga com rate limiting

## Contato

Para questões de segurança, entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0