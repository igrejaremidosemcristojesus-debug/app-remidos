const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs');

async function executarEnvio() {
  try {
    // 1. Ler o ficheiro "banco de dados" membros.json
    if (!fs.existsSync('membros.json')) {
      console.log('Ficheiro membros.json não foi encontrado na raiz do repositório.');
      return;
    }

    const membrosRaw = fs.readFileSync('membros.json', 'utf8');
    const membros = JSON.parse(membrosRaw);

    if (!Array.isArray(membros) || membros.length === 0) {
      console.log('Nenhum membro ou visitante encontrado no ficheiro membros.json.');
      return;
    }

    // 2. Ler a Planilha de Devocionais
    const workbook = XLSX.readFile('devocionais-365.xlsx');
    const sheetName = workbook.SheetNames[0];
    const devocionais = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 3. Identificar a Data de Hoje (no formato DD/MM, ex: "01/01")
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dataHoje = `${dia}/${mes}`;

    // 4. Procurar o devocional correspondente ao dia de hoje
    let dev = devocionais.find(d => String(d.Data).trim() === dataHoje);
    if (!dev && devocionais.length > 0) {
      dev = devocionais[0]; // Fallback se a data exata não for encontrada
    }

    if (!dev) {
      console.log('Nenhum devocional encontrado na planilha.');
      return;
    }

    // 5. Configurações da API de WhatsApp
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    if (!apiUrl || !apiKey) {
      console.log('AVISO: Variáveis WHATSAPP_API_URL ou WHATSAPP_API_KEY não estão configuradas nas Secrets do GitHub.');
      console.log('Pré-visualização do envio:');
      console.log(`Encontrados ${membros.length} destinatários em membros.json.`);
      return;
    }

    // 6. Percorrer a lista de membros e disparar a mensagem
    console.log(`Iniciando envio do devocional de hoje (${dataHoje}) para ${membros.length} pessoas...`);

    for (const pessoa of membros) {
      if (!pessoa.telefone) continue;

      // Limpa o número para manter apenas dígitos (ex: "5511999999999")
      const numeroFormatado = String(pessoa.telefone).replace(/\D/g, '');
      const nomePessoa = pessoa.nome || 'Irmão(ã)';

      // Monta a mensagem personalizada
      const mensagem = `☀️ *Bom dia, ${nomePessoa}!*\n\n` +
                       `📖 *Devocional - ${dev.Tema || 'Palavra do Dia'}*\n` +
                       `_${dev['Referência bíblica'] || ''}_\n\n` +
                       `${dev.Reflexão || ''}\n\n` +
                       `🙏 *Oração:* ${dev.Oração || ''}\n\n` +
                       `_Igreja Evangélica Remidos em Cristo_`;

      try {
        // Envio via API do WhatsApp
        await axios.post(apiUrl, {
          phone: numeroFormatado,
          message: mensagem
        }, {
          headers: { 
            'Client-Token': apiKey,
            'Content-Type': 'application/json'
          }
        });

        console.log(`✅ Devocional enviado com sucesso para: ${nomePessoa} (${numeroFormatado})`);
      } catch (erroEnvio) {
        console.error(`❌ Erro ao enviar para ${nomePessoa} (${numeroFormatado}):`, erroEnvio.message);
      }
    }

    console.log('Processo de envio finalizado!');

  } catch (error) {
    console.error('Erro ao processar a automação:', error);
  }
}

executarEnvio();
