# Fluig Token Fetcher

API para capturar automaticamente o JWT token do Fluig.

## 🎯 Como funciona

1. Abre um navegador headless (Puppeteer)
2. Faz login no Fluig automaticamente
3. Captura o JWT token do sessionStorage/localStorage
4. Retorna o token via API REST

## 📡 Endpoints disponíveis

### Health Check
```bash
GET /health
```

### Capturar Token
```bash
GET /get-token
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "expires_in": 3600
}
```

## ⚙️ Variáveis de Ambiente

Configure estas variáveis no EasyPanel:

- `FLUIG_URL`: URL do Fluig (padrão: https://uz196049.fluig.cloudtotvs.com.br)
- `FLUIG_USER`: Seu usuário do Fluig ⚠️ **Configure no EasyPanel**
- `FLUIG_PASS`: Sua senha do Fluig ⚠️ **Configure no EasyPanel**
- `PORT`: Porta do servidor (padrão: 3000)

## 🚀 Deploy no EasyPanel

1. Crie um novo serviço "From GitHub"
2. Conecte este repositório
3. Configure as variáveis de ambiente (usuário e senha)
4. Faça o deploy!

## 🔧 Uso no n8n

No n8n, use um HTTP Request:
```
Method: GET
URL: http://seu-servico:3000/get-token
```

O token retornado pode ser usado em chamadas subsequentes:
```
Authorization: Bearer {{$json.token}}
```
