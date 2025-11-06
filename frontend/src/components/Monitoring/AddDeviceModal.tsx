import React, { useState } from 'react';
import styled from 'styled-components';
import { DeviceType } from '../../types/monitoring';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: NewDeviceData) => void;
  isLoading?: boolean;
}

export interface NewDeviceData {
  name: string;
  ipAddress: string;
  type: DeviceType;
  location: string;
  description?: string;
  credentials?: {
    username: string;
    password: string;
    snmpCommunity?: string;
  };
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<NewDeviceData>({
    name: '',
    ipAddress: '',
    type: DeviceType.ROUTER,
    location: '',
    description: '',
    credentials: {
      username: '',
      password: '',
      snmpCommunity: 'public'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const deviceTypes = [
    { value: DeviceType.ROUTER, label: 'Routeur', icon: '🔀' },
    { value: DeviceType.SWITCH, label: 'Switch', icon: '🔌' },
    { value: DeviceType.FIREWALL, label: 'Firewall', icon: '🛡️' },
    { value: DeviceType.ACCESS_POINT, label: 'Point d\'accès', icon: '📶' },
    { value: DeviceType.SERVER, label: 'Serveur', icon: '🖥️' },
    { value: DeviceType.WORKSTATION, label: 'Poste de travail', icon: '💻' },
    { value: DeviceType.PRINTER, label: 'Imprimante', icon: '🖨️' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = 'L\'adresse IP est requise';
    } else {
      // Validation basique IP
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(formData.ipAddress)) {
        newErrors.ipAddress = 'Adresse IP invalide';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'L\'emplacement est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof NewDeviceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials!,
        [field]: value
      }
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      type: DeviceType.ROUTER,
      location: '',
      description: '',
      credentials: {
        username: '',
        password: '',
        snmpCommunity: 'public'
      }
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Icon>➕</Icon>
            Ajouter un équipement
          </ModalTitle>
          <CloseButton onClick={handleClose}>✕</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>Informations générales</SectionTitle>
            
            <FormGroup>
              <Label>Nom de l'équipement *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Routeur-Principal"
                hasError={!!errors.name}
              />
              {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Adresse IP *</Label>
              <Input
                type="text"
                value={formData.ipAddress}
                onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                placeholder="Ex: 192.168.1.1"
                hasError={!!errors.ipAddress}
              />
              {errors.ipAddress && <ErrorMessage>{errors.ipAddress}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Type d'équipement *</Label>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as DeviceType)}
              >
                {deviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Emplacement *</Label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ex: Salle serveur A1"
                hasError={!!errors.location}
              />
              {errors.location && <ErrorMessage>{errors.location}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description optionnelle de l'équipement..."
                rows={3}
              />
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>Authentification</SectionTitle>
            
            <FormGroup>
              <Label>Nom d'utilisateur</Label>
              <Input
                type="text"
                value={formData.credentials?.username || ''}
                onChange={(e) => handleCredentialChange('username', e.target.value)}
                placeholder="Utilisateur pour la connexion"
              />
            </FormGroup>

            <FormGroup>
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={formData.credentials?.password || ''}
                onChange={(e) => handleCredentialChange('password', e.target.value)}
                placeholder="Mot de passe"
              />
            </FormGroup>

            <FormGroup>
              <Label>Communauté SNMP</Label>
              <Input
                type="text"
                value={formData.credentials?.snmpCommunity || ''}
                onChange={(e) => handleCredentialChange('snmpCommunity', e.target.value)}
                placeholder="public"
              />
            </FormGroup>
          </FormSection>

          <ModalFooter>
            <SecondaryButton type="button" onClick={handleClose}>
              Annuler
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Ajout en cours...
                </>
              ) : (
                'Ajouter l\'équipement'
              )}
            </PrimaryButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled Components
const ModalOverlay = styled.div`
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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Icon = styled.span`
  font-size: 28px;
`;

const CloseButton = styled.button`
  background: #f3f4f6;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const Form = styled.form`
  padding: 32px;
`;

const FormSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f3f4f6;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const PrimaryButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;