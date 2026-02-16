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


exports.resetPasswordByAdmin = functions.https.onCall(async (data, context) => {
    // 1. Check for authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'A requisição deve ser autenticada.');
    }

    // 2. Check if caller is an admin by reading their Firestore document
    const adminId = context.auth.uid;
    const adminDocRef = admin.firestore().collection('users').doc(adminId);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem redefinir senhas.');
    }

    // 3. Get data from the client
    const { targetUserId, newPassword } = data;
    if (!targetUserId || !newPassword || newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'ID do usuário e uma senha com no mínimo 6 caracteres são obrigatórios.');
    }
    
    // 4. Prevent admin from changing their own password this way or changing the main admin's password
    const targetUserDoc = await admin.firestore().collection('users').doc(targetUserId).get();
    if(targetUserDoc.exists() && targetUserDoc.data().email === 'keennlemariem@gmail.com') {
         throw new functions.https.HttpsError('permission-denied', 'A senha do administrador principal não pode ser alterada por esta função.');
    }

    // 5. Update password using Admin SDK
    try {
        await admin.auth().updateUser(targetUserId, { password: newPassword });
        console.log(`Senha do usuário ${targetUserId} foi redefinida pelo admin ${adminId}.`);
        return { success: true, message: 'Senha redefinida com sucesso.' };
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        throw new functions.https.HttpsError('internal', 'Ocorreu um erro interno ao tentar redefinir a senha.');
    }
});


exports.deleteUserByAdmin = functions.https.onCall(async (data, context) => {
    // 1. Check for authentication and admin role
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'A requisição deve ser autenticada.');
    }
    const adminId = context.auth.uid;
    const adminDoc = await admin.firestore().collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem excluir usuários.');
    }

    // 2. Get data from client and validate
    const { targetUserId, reason } = data;
    if (!targetUserId || !reason) {
        throw new functions.https.HttpsError('invalid-argument', 'ID do usuário e justificativa são obrigatórios.');
    }
    
    // 3. Fetch target user to prevent self-deletion or main admin deletion
    const targetUserDoc = await admin.firestore().collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usuário alvo não encontrado.');
    }
    const targetUserData = targetUserDoc.data();
     if (targetUserData.email === 'keennlemariem@gmail.com') {
        throw new functions.https.HttpsError('permission-denied', 'O administrador principal não pode ser excluído.');
    }
     if (targetUserId === adminId) {
        throw new functions.https.HttpsError('permission-denied', 'O administrador não pode excluir a si mesmo.');
    }

    // 4. Create deletion report
    const report = {
        deletedUserId: targetUserId,
        deletedUserName: targetUserData.name || 'N/A',
        adminId: adminId,
        adminName: adminDoc.data().name,
        reason: reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection('deletionReports').add(report);
    
    // 5. Delete user from Firebase Auth (this will trigger onUserDeleted to clean up Firestore doc)
    try {
        await admin.auth().deleteUser(targetUserId);
        console.log(`Usuário ${targetUserId} foi excluído pelo admin ${adminId}.`);
        return { success: true, message: 'Usuário excluído com sucesso.' };
    } catch (error) {
        console.error('Erro ao excluir o usuário da autenticação:', error);
        // Attempt to clean up the report if deletion fails
        // This part is tricky, might leave an orphaned report but it's better than silent failure.
        throw new functions.https.HttpsError('internal', 'Falha ao excluir o usuário da autenticação. O relatório de exclusão pode ter sido criado.');
    }
});
