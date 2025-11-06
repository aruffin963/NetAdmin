import React, { useState } from 'react';
import styled from 'styled-components';
import { IpPoolCard } from '../components/IP/IpPoolCard';
import { IpAddressList } from '../components/IP/IpAddressList';
import { useIpPools, useCreateIpPool, useUpdateIpPool, useDeleteIpPool } from '../hooks/useIpApi';
import { useOrganizations, useCreateOrganization } from '../hooks/useOrganizationApi';

const IpManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pools' | 'addresses' | 'subnets'>('pools');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState<number | undefined>();
  
  // États pour les modales et actions
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // États pour les formulaires
  const [createForm, setCreateForm] = useState({
    name: '',
    network: '',
    description: '',
    gateway: '',
    dns_servers: [] as string[]
  });
  const [editForm, setEditForm] = useState({
    name: '',
    network: '',
    description: '',
    gateway: '',
    dns_servers: [] as string[]
  });
  const [orgForm, setOrgForm] = useState({
    name: '',
    domain: ''
  });

  // React Query pour les pools IP et organisations
  const { data: pools = [], isLoading, error } = useIpPools();
  const { data: organizations = [] } = useOrganizations();
  const createPoolMutation = useCreateIpPool();
  const updatePoolMutation = useUpdateIpPool();
  const deletePoolMutation = useDeleteIpPool();
  const createOrgMutation = useCreateOrganization();

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Actions pour les pools
  const handleCreatePool = () => {
    setShowCreateModal(true);
  };

  const handleEditPool = (pool: any) => {
    setSelectedPool(pool);
    setEditForm({
      name: pool.name,
      network: pool.network,
      description: pool.description || '',
      gateway: pool.gateway || '',
      dns_servers: pool.dns_servers || []
    });
    setShowEditModal(true);
  };

  const handleDeletePool = (pool: any) => {
    setSelectedPool(pool);
    setShowDeleteModal(true);
  };

  const handleViewPool = (pool: any) => {
    setSelectedPoolId(pool.id);
    setActiveTab('addresses');
    showNotification(`Affichage des adresses IP du pool "${pool.name}"`);
  };

  const confirmCreatePool = async () => {
    try {
      // Utiliser la première organisation disponible
      const currentOrg = organizations[0];
      if (!currentOrg) {
        showNotification('Aucune organisation trouvée. Créez d\'abord une organisation.', 'error');
        return;
      }

      await createPoolMutation.mutateAsync({
        name: createForm.name,
        network: createForm.network,
        description: createForm.description || undefined,
        gateway: createForm.gateway || undefined,
        dns_servers: createForm.dns_servers.length > 0 ? createForm.dns_servers : undefined,
        organization_id: currentOrg.id
      });
      showNotification('Nouveau pool IP créé avec succès !');
      setShowCreateModal(false);
      setCreateForm({ name: '', network: '', description: '', gateway: '', dns_servers: [] });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      showNotification('Erreur lors de la création du pool', 'error');
    }
  };

  const confirmCreateOrganization = async () => {
    try {
      await createOrgMutation.mutateAsync({
        name: orgForm.name,
        domain: orgForm.domain || undefined
      });
      showNotification('Organisation créée avec succès !');
      setShowCreateOrgModal(false);
      setOrgForm({ name: '', domain: '' });
    } catch (error) {
      console.error('Erreur lors de la création de l\'organisation:', error);
      showNotification('Erreur lors de la création de l\'organisation', 'error');
    }
  };

  const confirmEditPool = async () => {
    try {
      await updatePoolMutation.mutateAsync({
        id: selectedPool.id,
        data: {
          name: editForm.name,
          description: editForm.description || undefined,
          gateway: editForm.gateway || undefined,
          dns_servers: editForm.dns_servers.length > 0 ? editForm.dns_servers : undefined,
        }
      });
      showNotification(`Pool "${editForm.name}" modifié avec succès !`);
      setShowEditModal(false);
      setSelectedPool(null);
      setEditForm({ name: '', network: '', description: '', gateway: '', dns_servers: [] });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      showNotification('Erreur lors de la modification du pool', 'error');
    }
  };

  const confirmDeletePool = async () => {
    try {
      await deletePoolMutation.mutateAsync(selectedPool.id);
      showNotification(`Pool "${selectedPool.name}" supprimé avec succès !`);
      setShowDeleteModal(false);
      setSelectedPool(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification('Erreur lors de la suppression du pool', 'error');
    }
  };

  const filteredPools = pools.filter(pool =>
    pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pool.network.includes(searchTerm)
  );
  
  return (
    <Container>
      <Header>
        <Title>
          📊 Gestion IP
        </Title>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'pools'} 
          onClick={() => setActiveTab('pools')}
        >
          Pools IP
        </Tab>
        <Tab 
          active={activeTab === 'addresses'} 
          onClick={() => setActiveTab('addresses')}
        >
          Adresses IP
        </Tab>
        <Tab 
          active={activeTab === 'subnets'} 
          onClick={() => setActiveTab('subnets')}
        >
          Sous-réseaux
        </Tab>
      </TabContainer>

      <Controls>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Rechercher pools, réseaux..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon>🔍</SearchIcon>
        </SearchContainer>
        <AddButton onClick={handleCreatePool}>
          + Nouveau Pool
        </AddButton>
      </Controls>

      <Content>
        {activeTab === 'pools' && (
          <>
            {error && (
              <ErrorMessage>
                Erreur lors du chargement des pools IP. Veuillez réessayer.
              </ErrorMessage>
            )}
            
            {isLoading ? (
              <LoadingMessage>Chargement des pools IP...</LoadingMessage>
            ) : (
              <PoolsGrid>
                {filteredPools.map(pool => (
                  <IpPoolCard
                    key={pool.id}
                    pool={pool}
                    onView={() => handleViewPool(pool)}
                    onEdit={() => handleEditPool(pool)}
                    onDelete={() => handleDeletePool(pool)}
                  />
                ))}
                {filteredPools.length === 0 && !isLoading && (
                  <EmptyState>
                    <EmptyIcon>🏢</EmptyIcon>
                    <EmptyTitle>Aucun pool trouvé</EmptyTitle>
                    <EmptyText>
                      {searchTerm 
                        ? 'Aucun pool ne correspond à votre recherche' 
                        : organizations.length === 0 
                          ? 'Créez d\'abord une organisation pour commencer'
                          : 'Aucun pool IP configuré'}
                    </EmptyText>
                    {!searchTerm && (
                      <ActionButton onClick={() => setShowCreateOrgModal(true)}>
                        + Créer une organisation
                      </ActionButton>
                    )}
                  </EmptyState>
                )}
              </PoolsGrid>
            )}
          </>
        )}

        {activeTab === 'addresses' && (
          <IpAddressList poolId={selectedPoolId} />
        )}

        {activeTab === 'subnets' && (
          <PlaceholderContent>
            <PlaceholderIcon></PlaceholderIcon>
            <PlaceholderTitle>Gestion des Sous-réseaux</PlaceholderTitle>
            <PlaceholderText>
              Configuration et gestion des sous-réseaux VLAN.
              Fonctionnalités é venir : création, segmentation, routage.
            </PlaceholderText>
          </PlaceholderContent>
        )}
      </Content>

      {/* Notification */}
      {notification.show && (
        <Notification type={notification.type}>
          {notification.message}
        </Notification>
      )}

      {/* Modal Création Pool */}
      {showCreateModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>🆕 Créer un nouveau Pool IP</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormField>
                <Label>Nom du Pool</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: Pool Serveurs"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                />
              </FormField>
              <FormField>
                <Label>Réseau CIDR</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: 192.168.1.0/24"
                  value={createForm.network}
                  onChange={(e) => setCreateForm({...createForm, network: e.target.value})}
                />
              </FormField>
              <FormField>
                <Label>Gateway (optionnel)</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: 192.168.1.1"
                  value={createForm.gateway}
                  onChange={(e) => setCreateForm({...createForm, gateway: e.target.value})}
                />
              </FormField>
              <FormField>
                <Label>Description</Label>
                <Input 
                  type="text" 
                  placeholder="Description du pool"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                />
              </FormField>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={confirmCreatePool}
                disabled={createPoolMutation.isPending || !createForm.name || !createForm.network}
              >
                {createPoolMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Édition Pool */}
      {showEditModal && selectedPool && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>✏️ Modifier le Pool "{selectedPool.name}"</ModalTitle>
              <CloseButton onClick={() => setShowEditModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormField>
                <Label>Nom du Pool</Label>
                <Input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </FormField>
              <FormField>
                <Label>Réseau CIDR</Label>
                <Input 
                  type="text" 
                  value={editForm.network}
                  disabled
                  title="Le réseau ne peut pas être modifié après création"
                />
              </FormField>
              <FormField>
                <Label>Gateway (optionnel)</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: 192.168.1.1"
                  value={editForm.gateway}
                  onChange={(e) => setEditForm({...editForm, gateway: e.target.value})}
                />
              </FormField>
              <FormField>
                <Label>Description</Label>
                <Input 
                  type="text" 
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </FormField>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={confirmEditPool}
                disabled={updatePoolMutation.isPending || !editForm.name}
              >
                {updatePoolMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Suppression Pool */}
      {showDeleteModal && selectedPool && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>🗑️ Supprimer le Pool "{selectedPool.name}"</ModalTitle>
              <CloseButton onClick={() => setShowDeleteModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <WarningText>
                ⚠️ Êtes-vous sûr de vouloir supprimer ce pool IP ?
              </WarningText>
              <InfoText>
                Cette action est irréversible et supprimera toutes les adresses IP associées.
              </InfoText>
              <PoolInfo>
                <strong>Pool :</strong> {selectedPool.name}<br/>
                <strong>Réseau :</strong> {selectedPool.network}<br/>
                <strong>Adresses utilisées :</strong> {selectedPool.usedCount || 0}/{selectedPool.totalCount || 0}
              </PoolInfo>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="danger" 
                onClick={confirmDeletePool}
                disabled={deletePoolMutation.isPending}
              >
                {deletePoolMutation.isPending ? 'Suppression...' : 'Supprimer définitivement'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Création Organisation */}
      {showCreateOrgModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>🏢 Créer une nouvelle Organisation</ModalTitle>
              <CloseButton onClick={() => setShowCreateOrgModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormField>
                <Label>Nom de l'Organisation</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: Mon Entreprise"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                />
              </FormField>
              <FormField>
                <Label>Domaine (optionnel)</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: monentreprise.local"
                  value={orgForm.domain}
                  onChange={(e) => setOrgForm({...orgForm, domain: e.target.value})}
                />
              </FormField>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowCreateOrgModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary"
                onClick={confirmCreateOrganization}
                disabled={!orgForm.name.trim() || createOrgMutation.isPending}
              >
                {createOrgMutation.isPending ? 'Création...' : 'Créer l\'Organisation'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.active ? '#2563eb' : '#666'};
  border-bottom: 3px solid ${props => props.active ? '#2563eb' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #2563eb;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #2563eb;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #666;
`;

const AddButton = styled.button`
  padding: 12px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

const Content = styled.div`
  min-height: 400px;
`;

const PoolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
`;

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 16px;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  max-width: 400px;
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #666;
`;

const PlaceholderIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const PlaceholderTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
`;

const PlaceholderText = styled.p`
  font-size: 14px;
  max-width: 400px;
  line-height: 1.5;
  margin: 0;
`;

// Styles pour les modales et notifications
const Notification = styled.div<{ type: 'success' | 'error' }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  background: ${props => props.type === 'success' ? '#10b981' : '#ef4444'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  min-width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  
  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #2563eb;
  }
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
        `;
      case 'danger':
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
    }
  }}
`;

const WarningText = styled.p`
  color: #dc2626;
  font-weight: 500;
  margin-bottom: 12px;
`;

const InfoText = styled.p`
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const PoolInfo = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  color: #374151;
  line-height: 1.6;
`;

const ActionButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;
  transition: background-color 0.2s;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

export default IpManagement;
