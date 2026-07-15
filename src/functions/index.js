const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onUserDeleted } = require("firebase-functions/v2/auth"); // Gatilho de Auth v2
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Gatilho v2: Remove o perfil do Firestore quando o usuário é deletado da Autenticação.
 */
exports.onUserDeleted = onUserDeleted(async (event) => {
  const user = event.data;
  if (!user) return;
  
  const userId = user.uid;
  try {
    await db.collection('users').doc(userId).delete();
    console.log(`Perfil do usuário ${userId} removido com sucesso.`);
  } catch (error) {
    console.error(`Erro ao limpar Firestore para ${userId}:`, error);
  }
});

/**
 * Redefine senha via Admin (v2).
 */
exports.resetPasswordByAdmin = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');

  const adminDoc = await db.collection('users').doc(auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new Error('Acesso negado.');
  }

  const { targetUserId, newPassword } = request.data;
  if (!targetUserId || !newPassword || newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Senha muito curta.');
  }
  
  try {
    await admin.auth().updateUser(targetUserId, { password: newPassword });
    return { success: true };
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Exclui usuário via Admin (v2).
 */
exports.deleteUserByAdmin = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');

  const adminDoc = await db.collection('users').doc(auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new Error('Acesso negado.');
  }

  const { targetUserId } = request.data;
  if (!targetUserId) throw new HttpsError('invalid-argument', 'ID necessário.');
  
  try {
    await admin.auth().deleteUser(targetUserId);
    return { success: true };
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});
