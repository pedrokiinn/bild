// migrate.js
const admin = require('firebase-admin');

// Carregue a chave da sua conta de serviço
// IMPORTANTE: Substitua este arquivo pelo arquivo de chave de serviço real do seu projeto Firebase.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // IMPORTANTE: Substitua 'SEU-PROJECT-ID' pelo ID do seu projeto Firebase.
  databaseURL: "https://SEU-PROJECT-ID.firebaseio.com"
});

const db = admin.database();
const firestore = admin.firestore();

async function migrateData() {
  // 1. Crie uma referência para os dados no Realtime Database
  // IMPORTANTE: Altere '/tasks' para o caminho dos dados que você deseja migrar.
  const rtdbRef = db.ref('/tasks');

  // 2. Leia os dados uma única vez
  const snapshot = await rtdbRef.once('value');
  const dataToMigrate = snapshot.val();

  if (!dataToMigrate) {
    console.log("Nenhum dado encontrado no caminho especificado para migrar.");
    return;
  }

  console.log("Iniciando migração de dados...");

  // 3. Itere sobre cada item e escreva no Firestore
  // IMPORTANTE: Altere 'tasks' para o nome da coleção de destino no Firestore.
  const collectionName = 'tasks';
  const promises = Object.keys(dataToMigrate).map(key => {
    const item = dataToMigrate[key];
    
    // Exemplo de transformação: Converte strings de data para o tipo Timestamp do Firestore
    // Adapte esta lógica conforme a sua estrutura de dados.
    const firestoreItem = { ...item };
    if (item.createdAt && typeof item.createdAt === 'string') {
        firestoreItem.createdAt = new Date(item.createdAt);
    }
    if (item.updatedAt && typeof item.updatedAt === 'string') {
        firestoreItem.updatedAt = new Date(item.updatedAt);
    }

    // Adiciona o documento à coleção do Firestore.
    // Usamos a 'key' do RTDB como ID do documento para manter a referência.
    return firestore.collection(collectionName).doc(key).set(firestoreItem);
  });

  // 4. Espere todas as operações de escrita terminarem
  await Promise.all(promises);

  console.log(`Migração concluída com sucesso! ${Object.keys(dataToMigrate).length} registros migrados para a coleção '${collectionName}'.`);
}

migrateData().catch(error => {
    console.error("Ocorreu um erro durante a migração:", error);
    process.exit(1);
});
