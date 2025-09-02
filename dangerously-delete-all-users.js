// dangerously-delete-all-users.js
const admin = require('firebase-admin');

// Carregue a chave da sua conta de serviço
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllUsers() {
    console.log("Iniciando a exclusão de TODOS os usuários...");
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();

    if (snapshot.empty) {
        console.log("Nenhum usuário encontrado para excluir.");
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        console.log(`- Marcando para exclusão: ${doc.id} (Nome: ${doc.data().name})`);
        batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`\nOperação concluída. ${snapshot.size} usuários foram excluídos com sucesso.`);
    console.log("É recomendado que você recadastre o usuário administrador 'PedroNobre' pela interface da aplicação.");
}

deleteAllUsers().catch(error => {
    console.error("\nOcorreu um erro durante o processo de exclusão:", error);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
