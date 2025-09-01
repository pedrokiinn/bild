// seed.js
const admin = require('firebase-admin');

// Carregue a chave da sua conta de serviço
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// --- Dados de Exemplo ---

const usersToSeed = [
    {
        name: "Ana Silva",
        role: "collaborator",
        password: "colaborador123"
    },
    {
        name: "Carlos Souza",
        role: "collaborator",
        password: "colaborador456"
    }
];

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

async function seedCollection(collectionName, data) {
  console.log(`Iniciando o seed da coleção '${collectionName}'...`);
  const collectionRef = db.collection(collectionName);
  const promises = data.map(async (item) => {
    try {
      await collectionRef.add(item);
      return 1;
    } catch (error) {
      console.error(`Erro ao adicionar item na coleção '${collectionName}': `, item, error);
      return 0;
    }
  });

  const results = await Promise.all(promises);
  const successCount = results.reduce((acc, result) => acc + result, 0);
  console.log(`Seed da coleção '${collectionName}' concluído. ${successCount} de ${data.length} documentos adicionados.`);
}

async function seedDatabase() {
    console.log("--- Iniciando o processo de seed do banco de dados ---");
    
    await seedCollection('users', usersToSeed);
    await seedCollection('vehicles', vehiclesToSeed);
    
    console.log("\n--- Processo de seed finalizado com sucesso! ---");
    console.log("Lembre-se de cadastrar o usuário administrador 'PedroNobre' pela interface da aplicação.");
}

seedDatabase().catch(error => {
    console.error("\nOcorreu um erro durante o processo de seed:", error);
    process.exit(1);
});
