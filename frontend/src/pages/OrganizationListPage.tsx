import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBuilding, FaPlus, FaEdit, FaTrash, FaNetworkWired, FaServer } from 'react-icons/fa';

interface Organization {
  id: number;
  name: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  subnet_count: string;
  vlan_count: string;
  total_ips: string;
  allocated_ips: string;
  available_ips: string;
}

const OrganizationListPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ name: '', domain: '' });
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/organizations', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setOrganizations(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des organisations:', error);
      showAlert('error', 'Erreur lors du chargement des organisations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', 'Organisation créée avec succès');
        setShowCreateModal(false);
        setFormData({ name: '', domain: '' });
        fetchOrganizations();
      } else {
        showAlert('error', result.message);
      }
    } catch (error) {
      showAlert('error', 'Erreur lors de la création');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrg) return;

    try {
      const response = await fetch(`http://localhost:5000/api/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', 'Organisation modifiée avec succès');
        setShowEditModal(false);
        setSelectedOrg(null);
        setFormData({ name: '', domain: '' });
        fetchOrganizations();
      } else {
        showAlert('error', result.message);
      }
    } catch (error) {
      showAlert('error', 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer "${org.name}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/organizations/${org.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', 'Organisation supprimée avec succès');
        fetchOrganizations();
      } else {
        showAlert('error', result.message);
      }
    } catch (error) {
      showAlert('error', 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({ name: org.name, domain: org.domain });
    setShowEditModal(true);
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Chargement des organisations...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FaBuilding /> Organisations
        </Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <FaPlus /> Créer une organisation
        </CreateButton>
      </Header>

      {alert && (
        <Alert type={alert.type}>
          {alert.message}
        </Alert>
      )}

      <StatsBar>
        <StatItem>
          <StatValue>{organizations.length}</StatValue>
          <StatLabel>Organisations</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{organizations.reduce((acc, org) => acc + parseInt(org.subnet_count), 0)}</StatValue>
          <StatLabel>Sous-réseaux</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{organizations.reduce((acc, org) => acc + parseInt(org.vlan_count), 0)}</StatValue>
          <StatLabel>VLANs</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{organizations.reduce((acc, org) => acc + parseInt(org.total_ips), 0)}</StatValue>
          <StatLabel>Adresses IP</StatLabel>
        </StatItem>
      </StatsBar>

      {organizations.length === 0 ? (
        <EmptyState>
          <FaBuilding size={64} />
          <EmptyTitle>Aucune organisation</EmptyTitle>
          <EmptyText>Créez votre première organisation pour commencer</EmptyText>
          <CreateButton onClick={() => setShowCreateModal(true)}>
            <FaPlus /> Créer une organisation
          </CreateButton>
        </EmptyState>
      ) : (
        <OrganizationGrid>
          {organizations.map(org => (
            <OrgCard key={org.id}>
              <OrgHeader>
                <OrgIcon><FaBuilding /></OrgIcon>
                <OrgInfo>
                  <OrgName>{org.name}</OrgName>
                  <OrgDomain>{org.domain}</OrgDomain>
                </OrgInfo>
                <OrgActions>
                  <ActionButton onClick={() => openEditModal(org)} title="Modifier">
                    <FaEdit />
                  </ActionButton>
                  <ActionButton danger onClick={() => handleDelete(org)} title="Supprimer">
                    <FaTrash />
                  </ActionButton>
                </OrgActions>
              </OrgHeader>

              <OrgStats>
                <StatRow>
                  <StatIcon><FaNetworkWired /></StatIcon>
                  <StatText>
                    <StatNumber>{org.subnet_count}</StatNumber> sous-réseaux
                  </StatText>
                </StatRow>
                <StatRow>
                  <StatIcon><FaServer /></StatIcon>
                  <StatText>
                    <StatNumber>{org.vlan_count}</StatNumber> VLANs
                  </StatText>
                </StatRow>
                <StatRow>
                  <StatIcon>🌐</StatIcon>
                  <StatText>
                    <StatNumber>{org.total_ips}</StatNumber> adresses IP
                    <StatDetail>({org.allocated_ips} allouées, {org.available_ips} disponibles)</StatDetail>
                  </StatText>
                </StatRow>
              </OrgStats>

              <OrgFooter>
                <StatusBadge active={org.is_active}>
                  {org.is_active ? '● Actif' : '○ Inactif'}
                </StatusBadge>
                <OrgDate>Créé le {formatDate(org.created_at)}</OrgDate>
              </OrgFooter>
            </OrgCard>
          ))}
        </OrganizationGrid>
      )}

      {/* Modal Créer */}
      {showCreateModal && (
        <Modal>
          <ModalOverlay onClick={() => setShowCreateModal(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle><FaBuilding /> Créer une organisation</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleCreate}>
              <FormGroup>
                <Label>Nom de l'organisation *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Acme Corporation"
                />
              </FormGroup>
              <FormGroup>
                <Label>Domaine (optionnel)</Label>
                <Input
                  type="text"
                  value={formData.domain}
                  onChange={e => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="Ex: acme.netadmin.local"
                />
                <HelpText>Laissez vide pour générer automatiquement</HelpText>
              </FormGroup>
              <ModalActions>
                <CancelButton type="button" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </CancelButton>
                <SubmitButton type="submit">
                  <FaPlus /> Créer
                </SubmitButton>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Modifier */}
      {showEditModal && selectedOrg && (
        <Modal>
          <ModalOverlay onClick={() => setShowEditModal(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle><FaEdit /> Modifier l'organisation</ModalTitle>
              <CloseButton onClick={() => setShowEditModal(false)}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleEdit}>
              <FormGroup>
                <Label>Nom de l'organisation *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Domaine</Label>
                <Input
                  type="text"
                  value={formData.domain}
                  onChange={e => setFormData({ ...formData, domain: e.target.value })}
                />
              </FormGroup>
              <ModalActions>
                <CancelButton type="button" onClick={() => setShowEditModal(false)}>
                  Annuler
                </CancelButton>
                <SubmitButton type="submit">
                  <FaEdit /> Modifier
                </SubmitButton>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
`;

const Alert = styled.div<{ type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  background: ${props => props.type === 'success' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.type === 'success' ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.type === 'success' ? '#c3e6cb' : '#f5c6cb'};
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatItem = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #3498db;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
`;

const OrganizationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const OrgCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const OrgHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const OrgIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const OrgInfo = styled.div`
  flex: 1;
`;

const OrgName = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
`;

const OrgDomain = styled.div`
  font-size: 0.85rem;
  color: #7f8c8d;
  font-family: monospace;
`;

const OrgActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: ${props => props.danger ? '#fee' : '#f0f0f0'};
  color: ${props => props.danger ? '#e74c3c' : '#7f8c8d'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.danger ? '#e74c3c' : '#3498db'};
    color: white;
    transform: scale(1.1);
  }
`;

const OrgStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem 0;
  border-top: 1px solid #ecf0f1;
  border-bottom: 1px solid #ecf0f1;
`;

const StatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatIcon = styled.div`
  font-size: 1.25rem;
  color: #3498db;
`;

const StatText = styled.div`
  font-size: 0.9rem;
  color: #2c3e50;
`;

const StatNumber = styled.span`
  font-weight: 700;
  color: #3498db;
`;

const StatDetail = styled.span`
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-left: 0.5rem;
`;

const OrgFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.active ? '#155724' : '#721c24'};
`;

const OrgDate = styled.div`
  font-size: 0.8rem;
  color: #95a5a6;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #95a5a6;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem;
  color: #7f8c8d;
`;

const EmptyText = styled.p`
  margin-bottom: 2rem;
  color: #95a5a6;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem;
  font-size: 1.25rem;
  color: #7f8c8d;
`;

// Modal styles
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  color: #95a5a6;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;

  &:hover {
    color: #e74c3c;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const HelpText = styled.div`
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #ecf0f1;
  color: #7f8c8d;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #bdc3c7;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
`;

export default OrganizationListPage;
