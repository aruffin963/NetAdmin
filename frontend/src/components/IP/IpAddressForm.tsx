import React, { useState } from 'react';
import styled from 'styled-components';

// Types pour les formulaires
interface IpAddressFormData {
  address?: string;
  poolId: string;
  subnetId?: string;
  hostname?: string;
  macAddress?: string;
  description?: string;
  allocatedTo?: string;
}

interface IpAddressFormProps {
  onSubmit: (data: IpAddressFormData) => void;
  onCancel: () => void;
  initialData?: Partial<IpAddressFormData>;
  pools?: Array<{ id: string; name: string; network: string }>;
  subnets?: Array<{ id: string; name: string; network: string }>;
  isSubmitting?: boolean;
  isLoading?: boolean;
}

export const IpAddressForm: React.FC<IpAddressFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  pools = [],
  subnets = [],
  isSubmitting = false
  // isLoading sera utilisé plus tard pour les états de chargement
}) => {
  const [formData, setFormData] = useState<IpAddressFormData>({
    address: initialData.address || '',
    poolId: initialData.poolId || '',
    subnetId: initialData.subnetId || '',
    hostname: initialData.hostname || '',
    macAddress: initialData.macAddress || '',
    description: initialData.description || '',
    allocatedTo: initialData.allocatedTo || ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof IpAddressFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IpAddressFormData, string>> = {};

    if (!formData.poolId) {
      newErrors.poolId = 'Pool IP requis';
    }

    if (formData.address && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.address)) {
      newErrors.address = 'Format IP invalide (ex: 192.168.1.100)';
    }

    if (formData.macAddress && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.macAddress)) {
      newErrors.macAddress = 'Format MAC invalide (ex: 00:11:22:33:44:55)';
    }

    if (formData.hostname && formData.hostname.length > 255) {
      newErrors.hostname = 'Nom d\'hôte trop long (max 255 caractères)';
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

  const handleInputChange = (field: keyof IpAddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          {initialData.address ? 'Modifier l\'adresse IP' : 'Nouvelle adresse IP'}
        </FormTitle>
      </FormHeader>

      <FormContent onSubmit={handleSubmit}>
        <FormRow>
          <FormGroup>
            <Label>Adresse IP</Label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="192.168.1.100 (auto si vide)"
              error={!!errors.address}
            />
            {errors.address && <ErrorText>{errors.address}</ErrorText>}
            <HelpText>Laissez vide pour allocation automatique</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Pool IP *</Label>
            <Select
              value={formData.poolId}
              onChange={(e) => handleInputChange('poolId', e.target.value)}
              error={!!errors.poolId}
            >
              <option value="">Sélectionner un pool</option>
              {pools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} ({pool.network})
                </option>
              ))}
            </Select>
            {errors.poolId && <ErrorText>{errors.poolId}</ErrorText>}
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label>Sous-réseau</Label>
            <Select
              value={formData.subnetId}
              onChange={(e) => handleInputChange('subnetId', e.target.value)}
            >
              <option value="">Aucun sous-réseau</option>
              {subnets.map(subnet => (
                <option key={subnet.id} value={subnet.id}>
                  {subnet.name} ({subnet.network})
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Nom d'hôte</Label>
            <Input
              type="text"
              value={formData.hostname}
              onChange={(e) => handleInputChange('hostname', e.target.value)}
              placeholder="server-01"
              error={!!errors.hostname}
            />
            {errors.hostname && <ErrorText>{errors.hostname}</ErrorText>}
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label>Adresse MAC</Label>
            <Input
              type="text"
              value={formData.macAddress}
              onChange={(e) => handleInputChange('macAddress', e.target.value)}
              placeholder="00:11:22:33:44:55"
              error={!!errors.macAddress}
            />
            {errors.macAddress && <ErrorText>{errors.macAddress}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label>Attribué à</Label>
            <Input
              type="text"
              value={formData.allocatedTo}
              onChange={(e) => handleInputChange('allocatedTo', e.target.value)}
              placeholder="Nom de l'utilisateur ou équipement"
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Description optionnelle..."
            rows={3}
          />
        </FormGroup>

        <FormActions>
          <CancelButton type="button" onClick={onCancel}>
            Annuler
          </CancelButton>
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </SubmitButton>
        </FormActions>
      </FormContent>
    </FormContainer>
  );
};

// Styled Components
const FormContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e1e1;
  overflow: hidden;
  max-width: 600px;
  margin: 0 auto;
`;

const FormHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e1e1e1;
  background: #f8f9fa;
`;

const FormTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`;

const FormContent = styled.form`
  padding: 24px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input<{ error?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.error ? '#ef4444' : '#e1e5e9'};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#ef4444' : '#2563eb'};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select<{ error?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.error ? '#ef4444' : '#e1e5e9'};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#ef4444' : '#2563eb'};
  }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const HelpText = styled.span`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e1e1e1;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border: 2px solid #e1e5e9;
  background: white;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  border: none;
  background: #2563eb;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default IpAddressForm;