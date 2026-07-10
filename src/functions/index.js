const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function acionada ao deletar um usuário do Auth.
 * Remove o perfil correspondente no Firestore automaticamente.
 */
exports.onUserDeleted = functions.region('us-central1')
    .auth.user().onDelete(async (user) => {
    const userId = user.uid;
    try {
        await db.collection('users').doc(userId).delete();
        console.log(`Perfil do usuário ${userId} removido do Firestore.`);
    } catch (error) {
        console.error(`Erro ao limpar Firestore para ${userId}:`, error);
    }
});

/**
 * Redefine a senha de um usuário (apenas Admins).
 */
exports.resetPasswordByAdmin = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Autenticação necessária.');
    }

    const adminId = context.auth.uid;
    const adminDoc = await db.collection('users').doc(adminId).get();

    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado.');
    }

    const { targetUserId, newPassword } = data;
    if (!targetUserId || !newPassword || newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados inválidos.');
    }
    
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if(targetUserDoc.exists && targetUserDoc.data().email === 'keennlemariem@gmail.com') {
         throw new functions.https.HttpsError('permission-denied', 'Proibido alterar o admin principal.');
    }

    try {
        await admin.auth().updateUser(targetUserId, { password: newPassword });
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Exclui um usuário (apenas Admins).
 * Ao deletar do Auth, o gatilho onUserDeleted limpará o Firestore.
 */
exports.deleteUserByAdmin = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Autenticação necessária.');
    }
    const adminId = context.auth.uid;
    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado.');
    }

    const { targetUserId } = data;
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'ID do usuário obrigatório.');
    }
    
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) throw new functions.https.HttpsError('not-found', 'Usuário não encontrado.');
    
    const targetUserEmail = targetUserDoc.get('email');

    if (targetUserEmail === 'keennlemariem@gmail.com' || targetUserId === adminId) {
        throw new functions.https.HttpsError('permission-denied', 'Operação não permitida contra super-usuário.');
    }

    try {
        await admin.auth().deleteUser(targetUserId);
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
