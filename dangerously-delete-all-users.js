// dangerously-delete-all-users.js
const admin = require('firebase-admin');

// Carregue a chave da sua conta de serviço
const serviceAccount = require('./serviceAccountKey.json');

// Inicialize o Admin SDK com suas credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deleteAllAuthUsers() {
  console.log("Iniciando a exclusão de TODOS os usuários da Autenticação...");
  try {
    // Lista os usuários em lotes de 1000
    let listUsersResult = await admin.auth().listUsers(1000);
    
    if (listUsersResult.users.length === 0) {
        console.log("Nenhum usuário encontrado na Autenticação para excluir.");
        return;
    }

    while (listUsersResult.users.length > 0) {
      const uidsToDelete = listUsersResult.users.map(user => user.uid);
      
      const result = await admin.auth().deleteUsers(uidsToDelete);
      
      console.log(`- Deletados com sucesso ${result.successCount} usuários da Autenticação.`);
      if (result.failureCount > 0) {
        console.log(`- Falha ao deletar ${result.failureCount} usuários.`);
        result.errors.forEach(err => {
            console.error(`  Erro para UID ${err.uid}: ${err.error.message}`);
        });
      }

      // Pega o próximo lote de usuários
      if (listUsersResult.pageToken) {
        listUsersResult = await admin.auth().listUsers(1000, listUsersResult.pageToken);
      } else {
        break;
      }
    }
    console.log("\nProcesso de exclusão da Autenticação concluído.");
    console.log("Os dados associados no Firestore serão limpos pela Cloud Function (se implantada).");
    console.log("Para garantir um estado limpo, execute 'npm run seed' para recriar o usuário administrador.");

  } catch (error) {
    console.log('\nOcorreu um erro durante o processo de exclusão:', error);
  }
}

deleteAllAuthUsers().catch(error => {
    console.error("\nErro inesperado:", error);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
