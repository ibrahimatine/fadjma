const { BaseUser } = require('./src/models');

async function testLogin() {
  console.log('🔍 Test des comptes créés...\n');

  try {
    const users = await BaseUser.findAll({
      attributes: ['email', 'firstName', 'lastName', 'role', 'isActive']
    });

    console.log('👥 Utilisateurs dans la base:');
    users.forEach(user => {
      console.log(`  - ${user.email} | ${user.firstName} ${user.lastName} | ${user.role} | ${user.isActive ? 'actif' : 'inactif'}`);
    });

    console.log('\n🔐 Test de validation des mots de passe:');

    // Test avec chaque compte
    const testAccounts = [
      { email: 'dr.martin@fadjma.com', password: 'Demo2024!' },
      { email: 'patient1@demo.com', password: 'Demo2024!' },
      { email: 'pharmacie@fadjma.com', password: 'Demo2024!' },
      { email: 'admin@fadjma.com', password: 'Admin2024!' }
    ];

    for (const account of testAccounts) {
      const user = await BaseUser.findOne({ where: { email: account.email } });
      if (user) {
        const isValid = await user.validatePassword(account.password);
        console.log(`  ✅ ${account.email}: ${isValid ? 'OK' : '❌ ERREUR'}`);
      } else {
        console.log(`  ❌ ${account.email}: Utilisateur non trouvé`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }

  process.exit(0);
}

testLogin();