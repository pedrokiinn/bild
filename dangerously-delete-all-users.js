
// dangerously-delete-all-users.js
const admin = require('firebase-admin');

// Carregue a chave da sua conta de serviço
const serviceAccount = require('./serviceAccountKey.json');

// Inicialize o Admin SDK com suas credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllUsers() {
  console.log("Iniciando a exclusão de TODOS os usuários da Autenticação...");

  try {
    let usersToDelete = [];
    let pageToken;

    // Lista todos os usuários em lotes de 1000
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      
      listUsersResult.users.forEach(user => {
        console.log(`- Adicionando à lista de exclusão: ${user.email} (UID: ${user.uid})`);
        usersToDelete.push(user.uid);
      });

      pageToken = listUsersResult.pageToken;

    } while (pageToken);

    if (usersToDelete.length === 0) {
      console.log("\nNenhum usuário encontrado para excluir na Autenticação.");
    } else {
        console.log(`\nIniciando a exclusão de ${usersToDelete.length} usuário(s) da Autenticação...`);
        
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
        console.log("Os dados associados no Firestore para 'users' serão limpos pela Cloud Function (se implantada).");
    }

  } catch (error) {
    console.log('\nOcorreu um erro durante o processo de exclusão de usuários:', error);
  }
}

async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        return resolve();
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        console.log(`- Deletando documento: ${doc.ref.path}`);
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

async function clearCollections() {
    console.log("\nIniciando a limpeza de TODAS as coleções do Firestore (exceto 'users')...");
    
    // Adicione aqui as coleções que você quer limpar
    const collectionsToClear = ['vehicles', 'checklists', 'deletionReports']; 
    
    for (const collectionName of collectionsToClear) {
        console.log(`\nLimpando a coleção: '${collectionName}'...`);
        const snapshot = await db.collection(collectionName).limit(1).get();
        if(snapshot.empty) {
            console.log(`Coleção '${collectionName}' já está vazia.`);
            continue;
        }
        await deleteCollection(collectionName, 50);
        console.log(`Coleção '${collectionName}' foi limpa.`);
    }

    console.log("\nLimpeza de coleções do Firestore concluída.");
}

async function runAllDeletions() {
    await deleteAllUsers();
    await clearCollections();

    console.log("\n\nPROCESSO DE LIMPEZA COMPLETO.");
    console.log("Para recriar os dados, execute 'npm run seed'.");
    process.exit(0);
}

runAllDeletions().catch(error => {
    console.error("\nErro inesperado durante a execução geral:", error);
    process.exit(1);
});
