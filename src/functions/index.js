const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onUserDeleted } = require("firebase-functions/v1/auth");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function acionada ao deletar um usuário do Auth.
 * Remove o perfil correspondente no Firestore automaticamente.
 */
exports.onUserDeleted = onUserDeleted(async (user) => {
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
exports.resetPasswordByAdmin = onCall({ region: 'us-central1' }, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const adminDoc = await db.collection('users').doc(auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado.');
  }

  const { targetUserId, newPassword } = request.data;
  if (!targetUserId || !newPassword || newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Dados inválidos.');
  }
  
  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  if(targetUserDoc.exists && targetUserDoc.data().email === 'keennlemariem@gmail.com') {
    throw new HttpsError('permission-denied', 'Proibido alterar o admin principal.');
  }

  try {
    await admin.auth().updateUser(targetUserId, { password: newPassword });
    return { success: true };
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Exclui um usuário da Autenticação (apenas Admins).
 * O gatilho onUserDeleted cuidará de remover o Firestore.
 */
exports.deleteUserByAdmin = onCall({ region: 'us-central1' }, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const adminDoc = await db.collection('users').doc(auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Acesso negado.');
  }

  const { targetUserId } = request.data;
  if (!targetUserId) {
    throw new HttpsError('invalid-argument', 'ID do usuário obrigatório.');
  }
  
  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetUserDoc.exists) {
    throw new HttpsError('not-found', 'Perfil do usuário não encontrado no banco.');
  }
  
  const targetUserEmail = targetUserDoc.get('email');

  if (targetUserEmail === 'keennlemariem@gmail.com' || targetUserId === auth.uid) {
    throw new HttpsError('permission-denied', 'Operação não permitida contra super-usuário.');
  }

  try {
    await admin.auth().deleteUser(targetUserId);
    return { success: true };
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});
