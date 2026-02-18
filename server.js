const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

// Configurações do Fluig (vêm das variáveis de ambiente)
const FLUIG_URL = process.env.FLUIG_URL || 'https://uz196049.fluig.cloudtotvs.com.br';
const FLUIG_USER = process.env.FLUIG_USER;
const FLUIG_PASS = process.env.FLUIG_PASS;

// Endpoint principal: captura o token
app.get('/get-token', async (req, res) => {
  console.log('🔍 Iniciando captura de token...');
  
  // Validação: verifica se as credenciais foram configuradas
  if (!FLUIG_USER || !FLUIG_PASS) {
    return res.status(400).json({ 
      error: 'Credenciais não configuradas',
      message: 'Configure as variáveis FLUIG_USER e FLUIG_PASS no EasyPanel' 
    });
  }

  let browser;
  
  try {
    // Inicia o navegador invisível (headless)
    console.log('🌐 Abrindo navegador...');
    browser = await puppeteer.launch({
      headless: true, // invisível
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ]
    });
    
    const page = await browser.newPage();
    
    // Define um User-Agent (se identifica como navegador real)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('📄 Acessando página de login...');
    await page.goto(`${FLUIG_URL}/portal/p/1/pageworkplace`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Aguarda a página carregar completamente
    console.log('⏳ Aguardando formulário de login...');
    await page.waitForSelector('input[name="username"], input#username, input[type="text"]', { 
      timeout: 30000 
    });
    
    // Preenche o usuário
    console.log('👤 Preenchendo usuário...');
    const usernameInput = await page.$('input[name="username"]') || 
                           await page.$('input#username') ||
                           await page.$('input[type="text"]');
    await usernameInput.type(FLUIG_USER, { delay: 100 });
    
    // Preenche a senha
    console.log('🔐 Preenchendo senha...');
    const passwordInput = await page.$('input[name="password"]') || 
                           await page.$('input#password') ||
                           await page.$('input[type="password"]');
    await passwordInput.type(FLUIG_PASS, { delay: 100 });
    
    // Clica no botão de login
    console.log('🚀 Fazendo login...');
    const loginButton = await page.$('button[type="submit"]') || 
                         await page.$('input[type="submit"]') ||
                         await page.$('button.btn-primary');
    await loginButton.click();
    
    // Aguarda o login completar
    console.log('⏳ Aguardando login completar...');
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    // Aguarda um pouco mais para garantir que o token foi salvo
    await page.waitForTimeout(3000);
    
    // Captura o token do storage
    console.log('🎫 Capturando token...');
    const tokenData = await page.evaluate(() => {
      const token = sessionStorage.getItem('jwt.token') || 
                    localStorage.getItem('jwt.token') ||
                    sessionStorage.getItem('token') ||
                    localStorage.getItem('token');
      
      return {
        token: token,
        sessionStorage: Object.keys(sessionStorage).length,
        localStorage: Object.keys(localStorage).length
      };
    });
    
    await browser.close();
    
    if (!tokenData.token) {
      console.error('❌ Token não encontrado no storage');
      return res.status(404).json({ 
        error: 'Token não encontrado',
        debug: tokenData,
        message: 'O token não foi encontrado no sessionStorage ou localStorage'
      });
    }
    
    console.log('✅ Token capturado com sucesso!');
    
    // Retorna o token
    res.json({ 
      success: true,
      token: tokenData.token,
      timestamp: new Date().toISOString(),
      expires_in: 3600 // 1 hora (ajuste se necessário)
    });
    
  } catch (error) {
    if (browser) await browser.close();
    
    console.error('❌ Erro ao capturar token:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Erro ao capturar token',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint de health check (verifica se o serviço está funcionando)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'fluig-token-fetcher',
    timestamp: new Date().toISOString()
  });
});

// Endpoint raiz (documentação básica)
app.get('/', (req, res) => {
  res.json({
    service: 'Fluig Token Fetcher',
    version: '1.0.0',
    endpoints: {
      '/health': 'Health check',
      '/get-token': 'Captura o JWT token do Fluig'
    },
    usage: {
      method: 'GET',
      url: '/get-token',
      response: {
        success: true,
        token: 'eyJhbGc...',
        timestamp: '2024-01-01T00:00:00.000Z',
        expires_in: 3600
      }
    }
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fluig Token Fetcher rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎫 Get token: http://localhost:${PORT}/get-token`);
});
