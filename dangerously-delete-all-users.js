// dangerously-delete-all-users.js
const admin = require('firebase-admin');

// Carregue a chave da sua conta de serviço
const serviceAccount = require('./serviceAccountKey.json');

// Inicialize o Admin SDK com suas credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const ADMIN_EMAIL_TO_KEEP = "keennlemariem@gmail.com";

async function deleteAllUsersExceptAdmin() {
  console.log("Iniciando a exclusão de TODOS os usuários da Autenticação, exceto o administrador principal...");
  console.log(`Usuário a ser mantido: ${ADMIN_EMAIL_TO_KEEP}\n`);

  try {
    let usersToDelete = [];
    let pageToken;

    // Lista todos os usuários em lotes de 1000
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      
      listUsersResult.users.forEach(user => {
        if (user.email.toLowerCase() === ADMIN_EMAIL_TO_KEEP.toLowerCase()) {
          console.log(`- Preservando o administrador: ${user.email} (UID: ${user.uid})`);
        } else {
          console.log(`- Adicionando à lista de exclusão: ${user.email} (UID: ${user.uid})`);
          usersToDelete.push(user.uid);
        }
      });

      pageToken = listUsersResult.pageToken;

    } while (pageToken);

    if (usersToDelete.length === 0) {
      console.log("\nNenhum usuário encontrado para excluir (além do administrador).");
      return;
    }

    console.log(`\nIniciando a exclusão de ${usersToDelete.length} usuário(s)...`);
    
    // Exclui os usuários em lotes de 1000 (máximo permitido pela API)
    for (let i = 0; i < usersToDelete.length; i += 1000) {
        const batch = usersToDelete.slice(i, i + 1000);
        const result = await admin.auth().deleteUsers(batch);
        
        console.log(`- Lote processado: ${result.successCount} usuários excluídos com sucesso, ${result.failureCount} falhas.`);
        if (result.failureCount > 0) {
          result.errors.forEach(err => {
              console.error(`  Erro para UID ${err.uid}: ${err.error.message}`);
          });
        }
    }
    
    console.log("\nProcesso de exclusão da Autenticação concluído.");
    console.log("Os dados associados no Firestore serão limpos pela Cloud Function (se implantada).");
    console.log("\nPara garantir um estado limpo, execute 'npm run seed' para recriar o usuário administrador, se necessário.");

  } catch (error) {
    console.log('\nOcorreu um erro durante o processo de exclusão:', error);
  }
}

deleteAllUsersExceptAdmin().catch(error => {
    console.error("\nErro inesperado:", error);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
