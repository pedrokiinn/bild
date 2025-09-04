const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function que é acionada quando um usuário é deletado
 * do Firebase Authentication. Esta função remove o documento
 * correspondente do usuário na coleção 'users' do Firestore.
 */
exports.onUserDeleted = functions.region('us-central1')
    .auth.user().onDelete(async (user) => {
    const userId = user.uid;
    console.log(`Iniciando a limpeza de dados para o usuário deletado: ${userId}`);

    try {
        const userDocRef = admin.firestore().collection('users').doc(userId);
        await userDocRef.delete();
        console.log(`Documento do usuário ${userId} foi deletado com sucesso do Firestore.`);
    } catch (error) {
        console.error(`Erro ao deletar o documento do usuário ${userId} do Firestore:`, error);
    }
});
