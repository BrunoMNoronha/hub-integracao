import fs from 'fs';
import path from 'path';
import readline from 'readline';

// --- 1. Definição de Constantes ---
const ROOT_DIR = process.cwd();

const TEMPLATES = {
  api: path.join(ROOT_DIR, 'api', 'template', 'action.js'),
  lib: path.join(ROOT_DIR, 'lib', 'template', 'client.js'),
  readme: path.join(ROOT_DIR, 'lib', 'template', 'README.md.template'),
  env: path.join(ROOT_DIR, 'lib', 'template', 'env.template'),
};

const ROOT_ENV_FILE = path.join(ROOT_DIR, '.env');
const ROOT_ENV_EXAMPLE_FILE = path.join(ROOT_DIR, '.env.example');

// --- 2. O "Router" Principal ---
async function main() {
  validateTemplates();
  const command = process.argv[2];
  const moduleName = process.argv[3];

  if (!moduleName) {
    console.error('❌ Erro: Por favor, especifique o nome do módulo.');
    process.exit(1);
  }

  switch (command) {
    case 'create':
      await createModule(moduleName);
      break;
    case 'delete':
      await deleteModule(moduleName);
      break;
    default:
      console.error(`❌ Erro: Comando "${command}" desconhecido.`);
      process.exit(1);
  }
}

// --- 3. Lógica de CRIAR Módulo (v2.5 - Rollback Seguro) ---
async function createModule(name) {
  console.log(`🚀 Iniciando criação do módulo: ${name}...`);

  // Lista de caminhos criados para permitir o rollback
  const createdPaths = [];
  
  // (REMOVIDO na v2.5) Não fazemos mais backup dos .env
  // let originalEnv = null; 
  // let originalEnvExample = null;
  
  // Variável para guardar o conteúdo que será adicionado aos .env
  let envContentToAdd = null;

  // Caminhos de destino
  const apiDestDir = path.join(ROOT_DIR, 'api', name);
  const libDestDir = path.join(ROOT_DIR, 'lib', name);
  const apiDestFile = path.join(apiDestDir, 'action.js');
  const libDestFile = path.join(libDestDir, 'client.js');
  const readmeDestFile = path.join(libDestDir, 'README.md');
  const moduleEnvExampleFile = path.join(libDestDir, '.env.example');

  try {
    // 1. Verificação de Existência
    if (fs.existsSync(libDestDir) || fs.existsSync(apiDestDir)) {
      throw new Error(`O módulo "${name}" já existe. A criação foi abortada.`);
    }
    
    // 2. (REMOVIDO na v2.5) Backup dos .env da RAIZ

    // 3. Criar Diretórios
    fs.mkdirSync(apiDestDir, { recursive: true });
    createdPaths.push(apiDestDir);
    fs.mkdirSync(libDestDir, { recursive: true });
    createdPaths.push(libDestDir);
    console.log('📁 Diretórios criados com sucesso.');

    // 4. Processar e Copiar Ficheiros do Módulo
    processTemplate(TEMPLATES.api, apiDestFile, name);
    createdPaths.push(apiDestFile);
    processTemplate(TEMPLATES.lib, libDestFile, name);
    createdPaths.push(libDestFile);
    processTemplate(TEMPLATES.readme, readmeDestFile, name);
    createdPaths.push(readmeDestFile);

    // 5. Processar e Distribuir Variáveis de Ambiente
    console.log(`📝 Gerando ficheiros de ambiente...`);
    // Processa o conteúdo e guarda-o para o caso de precisarmos de rollback
    envContentToAdd = processTemplateContent(TEMPLATES.env, name);
    
    // 5a. Criar o .env.example (documentação) dentro do módulo
    fs.writeFileSync(moduleEnvExampleFile, envContentToAdd, 'utf8');
    createdPaths.push(moduleEnvExampleFile);
    console.log(`   -> Ficheiro de documentação criado: /lib/${name}/.env.example`);

    // 5b. Anexar variáveis ao .env (funcional) na RAIZ
    fs.appendFileSync(ROOT_ENV_FILE, `\n${envContentToAdd}`, 'utf8');
    console.log(`   -> Variáveis funcionais anexadas ao: .env (na raiz)`);

    // 5c. Anexar variáveis ao .env.example (documentação) na RAIZ
    fs.appendFileSync(ROOT_ENV_EXAMPLE_FILE, `\n${envContentToAdd}`, 'utf8');
    console.log(`   -> Variáveis de documentação anexadas ao: .env.example (na raiz)`);
    
    // --- Sucesso ---
    console.log('\n✅ Módulo criado e ambientes atualizados com sucesso!');
    console.log('\n🔔 AÇÃO NECESSÁRIA:');
    console.log(`   Não se esqueça de preencher os novos valores no seu ficheiro ".env" (na raiz)!`);

  } catch (error) {
    // --- Falha (Início do Rollback v2.5) ---
    console.error(`\n❌ FALHA ao criar o módulo: ${error.message}`);
    console.warn('--- INICIANDO ROLLBACK ---');

    // 1. Rollback dos ficheiros e pastas criados
    for (const p of createdPaths.reverse()) {
      try {
        fs.rmSync(p, { recursive: true, force: true }); 
        console.log(`   -> Rollback: ${p} (deletado)`);
      } catch (rmError) { /* Ignora */ }
    }

    // --- (MELHORIA v2.5) ---
    // 2. Rollback seguro dos ficheiros .env da RAIZ
    // (Apenas remove as linhas que foram adicionadas)
    if (envContentToAdd !== null) {
      console.log('   -> Rollback: Removendo entradas dos ficheiros .env da raiz...');
      removeStringFromFile(ROOT_ENV_FILE, `\n${envContentToAdd}`);
      removeStringFromFile(ROOT_ENV_EXAMPLE_FILE, `\n${envContentToAdd}`);
    }
    // --- Fim da Melhoria ---

    console.warn('--- ROLLBACK CONCLUÍDO ---');
    process.exit(1);
  }
}

// --- 4. Lógica de DELETAR Módulo (v2.4 - Texto Claro) ---
async function deleteModule(name) {
  console.log(`🔍 Tentando deletar o módulo: ${name}...`);

  const apiDestDir = path.join(ROOT_DIR, 'api', name);
  const libDestDir = path.join(ROOT_DIR, 'lib', name); 

  const confirmed = await askConfirmation(
    `✋ ATENÇÃO: Tem a certeza que quer deletar permanentemente o módulo "${name}"?\n` +
    `   Isto irá tentar apagar:\n` +
    `   - A pasta /api/${name}\n`   +
    `   - A pasta /lib/${name} (e o .env.example dentro dela)\n`   +
    `   - REMOVER as entradas de ambiente dos ficheiros .env da RAIZ (os ficheiros em si NÃO serão apagados)\n` + // <-- Texto claro
    `   (y/N): `
  );

  if (!confirmed) {
    console.log('🚫 Operação cancelada pelo utilizador.');
    process.exit(0);
  }

  try {
    console.log(`🔥 Deletando o módulo "${name}"...`);

    if (fs.existsSync(apiDestDir)) {
      fs.rmSync(apiDestDir, { recursive: true, force: true });
      console.log(`   -> Pasta deletada: ${apiDestDir}`);
    } else {
      console.log(`   -> Pasta /api/${name} não encontrada. (Ignorado)`);
    }
    
    if (fs.existsSync(libDestDir)) {
      fs.rmSync(libDestDir, { recursive: true, force: true });
      console.log(`   -> Pasta deletada: ${libDestDir}`);
    } else {
      console.log(`   -> Pasta /lib/${name} não encontrada. (Ignorado)`);
    }

    const envContentToRemove = processTemplateContent(TEMPLATES.env, name);
    
    removeStringFromFile(ROOT_ENV_FILE, `\n${envContentToRemove}`);
    console.log(`   -> Entradas removidas do: .env (da raiz)`);
    removeStringFromFile(ROOT_ENV_EXAMPLE_FILE, `\n${envContentToRemove}`);
    console.log(`   -> Entradas removidas do: .env.example (da raiz)`);

    console.log(`✅ Módulo deletado com sucesso!`);

  } catch (error) {
    console.error(`❌ FALHA ao deletar o módulo: ${error.message}`);
    process.exit(1);
  }
}

// --- 5. Funções Auxiliares (sem alteração) ---

function validateTemplates() {
  console.log('🔎 Validando ficheiros de template...');
  let allOk = true;
  for (const [key, filePath] of Object.entries(TEMPLATES)) {
    if (!fs.existsSync(filePath)) {
      console.error(`   -> ❌ ERRO FATAL: Template "${key}" não encontrado em: ${filePath}`);
      allOk = false;
    }
  }

  if (!allOk) {
    console.error('Por favor, restaure os ficheiros de template em falta e tente novamente.');
    process.exit(1);
  }
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

function removeStringFromFile(filePath, stringToRemove) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    // Esta verificação impede que o ficheiro seja alterado se as entradas não existirem
    if (originalContent.includes(stringToRemove)) {
      const newContent = originalContent.replace(stringToRemove, '');
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } catch (error) {
    // Se o ficheiro .env não existir (ex: primeira execução), não faz mal
    if (error.code !== 'ENOENT') {
      console.warn(`   -> Aviso: Falha ao editar ${filePath}. ${error.message}`);
    }
  }
}

function processTemplate(sourcePath, destPath, name) {
  try {
    const processedContent = processTemplateContent(sourcePath, name);
    fs.writeFileSync(destPath, processedContent, 'utf8');
    console.log(`   -> Ficheiro criado: ${destPath}`);
  } catch (error) {
    throw error;
  }
}

function processTemplateContent(sourcePath, name) {
  const templateContent = fs.readFileSync(sourcePath, 'utf8');
  const moduleNameLower = name.toLowerCase();
  const moduleNameUpper = name.toUpperCase();

  let processedContent = templateContent.replaceAll('template', moduleNameLower);
  processedContent = processedContent.replaceAll('TEMPLATE', moduleNameUpper);
  
  return processedContent;
}

// --- 6. Executar o Script ---
main();