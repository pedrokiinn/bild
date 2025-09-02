// seed.js
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// Carregue a chave da sua conta de serviço (para o Admin SDK)
const serviceAccount = require('./serviceAccountKey.json');

// Carregue a configuração do cliente (para o Client SDK)
const firebaseConfig = {
  apiKey: "AIzaSyDWdh2PxShX7u8SKbbmxdP5zs8AYr31kcI",
  authDomain: "carcheck-gkeh4.firebaseapp.com",
  databaseURL: "https://carcheck-gkeh4-default-rtdb.firebaseio.com",
  projectId: "carcheck-gkeh4",
  storageBucket: "carcheck-gkeh4.appspot.com",
  messagingSenderId: "886519139268",
  appId: "1:886519139268:web:04140f3c22c85be986f291",
  measurementId: "G-YB09K8E6X3"
};

// Inicialize o Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://carcheck-gkeh4-default-rtdb.firebaseio.com`
});

// Inicialize o Client SDK
const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);

const db = admin.firestore();

// --- Dados de Exemplo ---

const adminUserToSeed = {
    name: "Pedro Nobre",
    email: "Keennlemariem@gmail.com",
    password: "Pedro234567"
};

const vehiclesToSeed = [
    {
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        license_plate: "XYZ-1234",
        color: "Prata",
        mileage: 15000
    },
    {
        brand: "Honda",
        model: "Civic",
        year: 2022,
        license_plate: "ABC-5678",
        color: "Preto",
        mileage: 32000
    },
    {
        brand: "Chevrolet",
        model: "Onix",
        year: 2024,
        license_plate: "QWE-9101",
        color: "Branco",
        mileage: 500
    }
];

// --- Funções de Seed ---

async function seedAdminUser() {
    console.log(`Verificando/Criando usuário administrador: ${adminUserToSeed.name}...`);
    try {
        // Tenta fazer login para ver se o usuário já existe
        await signInWithEmailAndPassword(clientAuth, adminUserToSeed.email, adminUserToSeed.password);
        console.log(`Usuário ${adminUserToSeed.name} já existe. Nenhuma ação necessária.`);
    } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            // Se não existe, cria o usuário
            console.log("Usuário não encontrado, criando...");
            try {
                const userCredential = await createUserWithEmailAndPassword(clientAuth, adminUserToSeed.email, adminUserToSeed.password);
                const user = userCredential.user;

                // Salva o perfil no Firestore com o UID do Auth como ID do documento
                await db.collection('users').doc(user.uid).set({
                    name: adminUserToSeed.name,
                    email: adminUserToseed.email,
                    role: 'admin' // O primeiro usuário é sempre admin
                });
                console.log(`Usuário administrador ${adminUserToSeed.name} criado com sucesso!`);
            } catch (creationError) {
                console.error(`Erro ao criar o usuário administrador:`, creationError);
            }
        } else {
            console.error(`Erro ao verificar o usuário administrador:`, error);
        }
    }
}

async function seedCollection(collectionName, data) {
  console.log(`\nPopulando a coleção '${collectionName}'...`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.limit(1).get();

  if (!snapshot.empty) {
      console.log(`Coleção '${collectionName}' já contém dados. Pulando.`);
      return;
  }
  
  console.log(`Adicionando ${data.length} documentos...`);
  const promises = data.map(item => collectionRef.add(item));
  await Promise.all(promises);
  console.log(`Coleção '${collectionName}' populada com sucesso.`);
}

async function seedDatabase() {
    console.log("--- Iniciando o processo de seed do banco de dados ---");
    
    // 1. Criar o usuário administrador primeiro para garantir que ele tenha a role 'admin'
    await seedAdminUser();
    
    // 2. Popular as outras coleções
    await seedCollection('vehicles', vehiclesToSeed);
    
    console.log("\n--- Processo de seed finalizado com sucesso! ---");
    console.log("Execute 'npm run dev' para iniciar a aplicação.");
    process.exit(0);
}

seedDatabase().catch(error => {
    console.error("\nOcorreu um erro durante o processo de seed:", error);
    process.exit(1);
});
