
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function acionada ao deletar um usuário do Auth.
 * Remove o perfil correspondente no Firestore.
 */
exports.onUserDeleted = functions.region('us-central1')
    .auth.user().onDelete(async (user) => {
    const userId = user.uid;
    try {
        await admin.firestore().collection('users').doc(userId).delete();
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
    const adminDoc = await admin.firestore().collection('users').doc(adminId).get();

    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado.');
    }

    const { targetUserId, newPassword } = data;
    if (!targetUserId || !newPassword || newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados inválidos.');
    }
    
    const targetUserDoc = await admin.firestore().collection('users').doc(targetUserId).get();
    if(targetUserDoc.exists() && targetUserDoc.data().email === 'keennlemariem@gmail.com') {
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
 * Exclui um usuário e gera relatório (apenas Admins).
 */
exports.deleteUserByAdmin = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Autenticação necessária.');
    }
    const adminId = context.auth.uid;
    const adminDoc = await admin.firestore().collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado.');
    }

    const { targetUserId, reason } = data;
    if (!targetUserId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'Justificativa obrigatória.');
    }
    
    const targetUserDoc = await admin.firestore().collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) throw new functions.https.HttpsError('not-found', 'Usuário não encontrado.');
    
    const targetUserData = targetUserDoc.data();
    if (targetUserData.email === 'keennlemariem@gmail.com' || targetUserId === adminId) {
        throw new functions.https.HttpsError('permission-denied', 'Operação não permitida.');
    }

    try {
        await admin.firestore().collection('deletionReports').add({
            deletedUserId: targetUserId,
            deletedUserName: targetUserData.name || 'N/A',
            adminId: adminId,
            adminName: adminDoc.data().name,
            reason: reason,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        await admin.auth().deleteUser(targetUserId);
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
