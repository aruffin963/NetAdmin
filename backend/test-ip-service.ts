/**
 * Test du service de gestion IP avec base de données réelle
 */

import { IpManagementService } from './src/services/ipManagementService';
import { logger } from './src/utils/logger';

async function testIpManagementService() {
  console.log('🧪 Test du service de gestion IP...\n');

  try {
    // Test 1: Récupérer les statistiques
    console.log('📊 Test des statistiques globales...');
    const stats = await IpManagementService.getIpStatistics();
    console.log('Statistiques:', JSON.stringify(stats, null, 2));
    console.log('✅ Statistiques récupérées\n');

    // Test 2: Récupérer tous les pools
    console.log('🌐 Test de récupération des pools...');
    const pools = await IpManagementService.getAllPools();
    console.log(`Nombre de pools trouvés: ${pools.length}`);
    pools.forEach(pool => {
      console.log(`- ${pool.name} (${pool.network}) - ${pool.allocated_addresses}/${pool.total_addresses} adresses allouées`);
    });
    console.log('✅ Pools récupérés\n');

    if (pools.length > 0) {
      // Test 3: Récupérer les adresses du premier pool
      const firstPool = pools[0];
      console.log(`📍 Test des adresses du pool "${firstPool.name}"...`);
      const addressResult = await IpManagementService.getAddressesByPool(
        firstPool.id, 
        undefined, // tous les statuts
        10, // limite à 10
        0   // offset 0
      );
      console.log(`Adresses trouvées: ${addressResult.total} (affichage des 10 premières)`);
      addressResult.addresses.slice(0, 5).forEach(addr => {
        console.log(`- ${addr.ip_address} [${addr.status}] ${addr.allocated_to || '(libre)'}`);
      });
      console.log('✅ Adresses récupérées\n');

      // Test 4: Essayer d'allouer une adresse disponible
      const availableAddress = addressResult.addresses.find(addr => addr.status === 'available');
      if (availableAddress) {
        console.log(`🔒 Test d'allocation de l'adresse ${availableAddress.ip_address}...`);
        const allocatedAddress = await IpManagementService.allocateAddress(
          availableAddress.id,
          'Test-Device-001',
          'test-hostname'
        );
        if (allocatedAddress) {
          console.log(`✅ Adresse ${allocatedAddress.ip_address} allouée avec succès`);
          
          // Test 5: Libérer l'adresse
          console.log(`🔓 Test de libération de l'adresse...`);
          const releasedAddress = await IpManagementService.releaseAddress(allocatedAddress.id);
          if (releasedAddress) {
            console.log(`✅ Adresse ${releasedAddress.ip_address} libérée avec succès`);
          }
        }
      } else {
        console.log('⚠️ Aucune adresse disponible pour test d\'allocation');
      }
    }

    // Test 6: Récupérer les sous-réseaux
    console.log('\n🌐 Test de récupération des sous-réseaux...');
    const subnets = await IpManagementService.getAllSubnets();
    console.log(`Nombre de sous-réseaux trouvés: ${subnets.length}`);
    subnets.forEach(subnet => {
      console.log(`- ${subnet.name} (${subnet.network}/${subnet.cidr}) ${subnet.vlan_id ? `VLAN ${subnet.vlan_id}` : ''}`);
    });
    console.log('✅ Sous-réseaux récupérés\n');

    // Test 7: Statistiques finales
    console.log('📊 Statistiques finales...');
    const finalStats = await IpManagementService.getIpStatistics();
    console.log('Statistiques finales:', JSON.stringify(finalStats, null, 2));

    console.log('\n🎉 Tous les tests du service de gestion IP ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter les tests
testIpManagementService()
  .then(() => {
    console.log('\n✨ Tests terminés avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec des tests:', error);
    process.exit(1);
  });