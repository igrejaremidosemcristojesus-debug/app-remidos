const XLSX = require('xlsx');
const axios = require('axios');

async function executarEnvio() {
  try {
    // 1. Ler a Planilha
    const workbook = XLSX.readFile('devocionais-365.xlsx');
    const sheetName = workbook.SheetNames[0];
    const devocionais = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 2. Identificar a Data de Hoje (DD/MM)
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dataHoje = `${dia}/${mes}`;

    // 3. Buscar Devocional do Dia
    let dev = devocionais.find(d => String(d.Data).trim() === dataHoje);
    if (!dev && devocionais.length > 0) {
      dev = devocionais[0];
    }

    if (!dev) {
      console.log('Nenhum devocional encontrado para hoje.');
      return;
    }

    // 4. Formatar Mensagem do WhatsApp
    const mensagem = `☀️ *Bom dia! Devocional da Igreja Remidos em Cristo*\n\n` +
                     `📖 *${dev.Tema || 'Devocional Diário'}*\n` +
                     `_${dev['Referência bíblica'] || ''}_\n\n` +
                     `${dev.Reflexão || ''}\n\n` +
                     `🙏 *Oração:* ${dev.Oração || ''}\n\n` +
                     `Que Deus abençoe grandemente o seu dia!`;

    console.log('Mensagem pronta para envio:\n', mensagem);

    // 5. Envio via API do WhatsApp
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (apiUrl && apiKey) {
      await axios.post(apiUrl, {
        message: mensagem
      }, {
        headers: { 'Client-Token': apiKey }
      });
      console.log('Devocional enviado com sucesso via WhatsApp!');
    } else {
      console.log('API do WhatsApp não configurada nas credenciais do GitHub.');
    }

  } catch (error) {
    console.error('Erro ao processar envio:', error);
  }
}

executarEnvio();
