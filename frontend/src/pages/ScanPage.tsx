import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useStartScan, useScanResults, useStopScan, ScanConfig, ScanResult } from '../hooks/useScanApi';
import { useSubnets, useCreateSubnet, useUpdateSubnet, useDeleteSubnet, CreateSubnetRequest, UpdateSubnetRequest } from '../hooks/useIpApi';
import Pagination from '../components/Common/Pagination';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scanAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// Styled Components
const ScanPageContainer = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 32px;
  animation: ${fadeIn} 0.8s ease-out;
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

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SubnetPanel = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;

const ScanControlPanel = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: fit-content;
  animation: ${fadeIn} 0.8s ease-out 0.4s both;
`;

const ResultsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
`;

const PanelTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SubnetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const SubnetCard = styled.div<{ isSelected?: boolean; isScanning?: boolean }>`
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : '#e2e8f0'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.isSelected ? '#eff6ff' : 'white'};
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
  }
  
  ${props => props.isScanning && css`
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
      animation: ${scanAnimation} 2s infinite;
    }
  `}
`;

const SubnetHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const SubnetName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  flex: 1;
`;

const VlanTag = styled.span`
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const SubnetInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
`;

const InfoItem = styled.div`
  font-size: 12px;
  color: #64748b;
  
  .label {
    font-weight: 600;
    color: #374151;
  }
  
  .value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    color: #1e293b;
  }
`;

const SubnetStats = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const SubnetActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
`;

const SubnetActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  ${props => props.variant === 'delete' ? `
    background: white;
    color: #dc2626;
    border-color: #fecaca;
    
    &:hover {
      background: #fef2f2;
      border-color: #dc2626;
    }
  ` : `
    background: white;
    color: #667eea;
    border-color: #c7d2fe;
    
    &:hover {
      background: #eef2ff;
      border-color: #667eea;
    }
  `}
`;

const StatBadge = styled.div<{ type: 'used' | 'free' | 'total' }>`
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  
  ${props => {
    switch (props.type) {
      case 'used':
        return `
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        `;
      case 'free':
        return `
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        `;
      case 'total':
        return `
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        `;
      default:
        return `
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        `;
    }
  }}
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  
  input {
    margin: 0;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary'; disabled?: boolean }>`
  width: 100%;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  border: none;
  margin-bottom: 12px;
  
  ${props => props.variant === 'primary' ? `
    background: ${props.disabled ? '#9ca3af' : 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)'};
    color: white;
    
    &:hover {
      ${!props.disabled && `
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
      `}
    }
  ` : `
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    
    &:hover {
      ${!props.disabled && `
        background: #f8fafc;
        color: #1e293b;
      `}
    }
  `}
`;

const ProgressBar = styled.div<{ progress: number; isScanning: boolean }>`
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  margin: 16px 0;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
`;

const ScanProgress = styled.div`
  text-align: center;
  margin: 16px 0;
  font-size: 14px;
  color: #64748b;
`;

const ResultsPanel = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  animation: ${fadeIn} 0.8s ease-out 0.6s both;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ isActive?: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.isActive ? `
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
  ` : `
    background: #f1f5f9;
    color: #64748b;
    
    &:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
  `}
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ResultsTable = styled.div`
  overflow-x: auto;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 130px 180px 100px 150px 120px 100px 1fr 80px;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  min-width: 900px;
`;

const TableRow = styled.div<{ status?: 'online' | 'offline' | 'reserved' | 'timeout' }>`
  display: grid;
  grid-template-columns: 130px 180px 100px 150px 120px 100px 1fr 80px;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  transition: background-color 0.2s ease;
  animation: ${fadeIn} 0.5s ease-out;
  min-width: 900px;
  align-items: center;
  
  &:hover {
    background: #f8fafc;
  }
  
  ${props => props.status === 'online' && `
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    padding-left: 12px;
  `}
  
  ${props => props.status === 'reserved' && `
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding-left: 12px;
  `}
`;

const IPAddress = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: #1e293b;
`;

const HostName = styled.span`
  color: #3b82f6;
  font-weight: 500;
`;

const StatusBadge = styled.span<{ status: 'online' | 'offline' | 'reserved' | 'timeout' }>`
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status) {
      case 'online':
        return `
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        `;
      case 'offline':
        return `
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        `;
      case 'reserved':
        return `
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fed7aa;
        `;
      case 'timeout':
        return `
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
        `;
      default:
        return `
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        `;
    }
  }}
`;

const DeviceType = styled.span`
  font-size: 12px;
  color: #64748b;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

// Styles pour le modal d'ajout de subnet
const AddSubnetButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

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
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.3s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  }
`;

const TextArea = styled.textarea<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#d1d5db'};
  border-radius: 8px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  transition: all 0.2s ease;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const ModalButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  ` : `
    background: white;
    color: #64748b;
    border-color: #d1d5db;
    
    &:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
  `}
`;

// Types
interface SubnetFormData {
  name: string;
  network: string;
  mask: number;
  vlan: number;
  description: string;
  gateway: string;
  dns1: string;
  dns2: string;
  section: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export const ScanPage: React.FC = () => {
  // API hooks
  const { data: subnets = [], isLoading: subnetsLoading } = useSubnets();
  const startScanMutation = useStartScan();
  const stopScanMutation = useStopScan();
  const createSubnetMutation = useCreateSubnet();
  const updateSubnetMutation = useUpdateSubnet();
  const deleteSubnetMutation = useDeleteSubnet();
  
  // State
  const [selectedSubnet, setSelectedSubnet] = useState<string | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'reserved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubnetId, setEditingSubnetId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SubnetFormData>({
    name: '',
    network: '',
    mask: 24,
    vlan: 0,
    description: '',
    gateway: '',
    dns1: '',
    dns2: '',
    section: ''
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  
  // Debouncer la recherche pour améliorer les performances
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Scan configuration
  const [scanConfig, setScanConfig] = useState<Omit<ScanConfig, 'network'>>({
    timeout: 1000,
    skipPing: false,
    resolveDNS: true,
    detectDevice: true,
    updateDatabase: false
  });

  // Récupérer les résultats du scan en cours
  const { data: currentScan } = useScanResults(currentScanId || undefined);
  
  const selectedSubnetData = subnets.find(s => s.id.toString() === selectedSubnet);
  const results = currentScan?.results || [];
  const isScanning = currentScan?.status === 'running' || currentScan?.status === 'pending';
  const scanProgress = currentScan ? Math.round((currentScan.hostsScanned / Math.max(currentScan.hostsFound, 1)) * 100) : 0;

  // Validation functions
  const isValidIP = (ip: string): boolean => {
    const parts = ip.split('.');
    return parts.length === 4 && parts.every(part => {
      const num = parseInt(part);
      return !isNaN(num) && num >= 0 && num <= 255;
    });
  };

  const calculateSubnetTotal = (mask: number): number => {
    return Math.pow(2, 32 - mask) - 2; // -2 pour network et broadcast
  };

  // Fonctions de gestion du formulaire d'ajout de subnet
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    
    if (!formData.network.trim()) {
      errors.network = 'L\'adresse réseau est requise';
    } else if (!isValidIP(formData.network)) {
      errors.network = 'Format d\'adresse IP invalide';
    }
    
    if (formData.mask < 8 || formData.mask > 30) {
      errors.mask = 'Le masque doit être entre 8 et 30';
    }
    
    if (formData.vlan < 0 || formData.vlan > 4094) {
      errors.vlan = 'Le VLAN doit être entre 0 et 4094';
    }
    
    if (formData.gateway && !isValidIP(formData.gateway)) {
      errors.gateway = 'Format d\'adresse IP invalide pour la passerelle';
    }
    
    if (formData.dns1 && !isValidIP(formData.dns1)) {
      errors.dns1 = 'Format d\'adresse IP invalide pour le DNS';
    }
    
    if (formData.dns2 && !isValidIP(formData.dns2)) {
      errors.dns2 = 'Format d\'adresse IP invalide pour le DNS';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof SubnetFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur pour ce champ si elle existe
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      network: '',
      mask: 24,
      vlan: 0,
      description: '',
      gateway: '',
      dns1: '',
      dns2: '',
      section: ''
    });
    setFormErrors({});
  };

  const handleAddSubnet = async () => {
    if (!validateForm()) return;
    
    try {
      const subnetData: CreateSubnetRequest = {
        name: formData.name,
        network: formData.network,
        cidr: formData.mask,
        gateway: formData.gateway || undefined,
        vlan_id: formData.vlan || undefined,
        description: formData.description || undefined,
        organization_id: 1 // TODO: Récupérer l'ID de l'organisation depuis le contexte
      };
      
      await createSubnetMutation.mutateAsync(subnetData);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la création du subnet:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur
    }
  };

  const handleEditSubnet = (subnetId: number) => {
    const subnet = subnets.find(s => s.id === subnetId);
    if (!subnet) return;
    
    setFormData({
      name: subnet.name,
      network: subnet.network,
      mask: subnet.cidr,
      vlan: subnet.vlan_id || 0,
      description: subnet.description || '',
      gateway: subnet.gateway || '',
      dns1: '',
      dns2: '',
      section: ''
    });
    setEditingSubnetId(subnetId);
    setShowEditModal(true);
  };

  const handleUpdateSubnet = async () => {
    if (!validateForm() || !editingSubnetId) return;
    
    try {
      const updateData: UpdateSubnetRequest = {
        name: formData.name,
        network: formData.network,
        cidr: formData.mask,
        gateway: formData.gateway || undefined,
        vlan_id: formData.vlan || undefined,
        description: formData.description || undefined
      };
      
      await updateSubnetMutation.mutateAsync({ id: editingSubnetId, data: updateData });
      setShowEditModal(false);
      setEditingSubnetId(null);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la modification du subnet:', error);
    }
  };

  const handleDeleteSubnet = async (subnetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const subnet = subnets.find(s => s.id === subnetId);
    if (!subnet) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le subnet "${subnet.name}" ?`)) {
      try {
        await deleteSubnetMutation.mutateAsync(subnetId);
        if (selectedSubnet === subnetId.toString()) {
          setSelectedSubnet(null);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du subnet:', error);
      }
    }
  };

  const startScan = async () => {
    if (!selectedSubnet || !selectedSubnetData) return;
    
    const network = `${selectedSubnetData.network}/${selectedSubnetData.cidr}`;
    const config: ScanConfig = {
      network,
      timeout: scanConfig.timeout,
      skipPing: scanConfig.skipPing,
      resolveDNS: scanConfig.resolveDNS,
      detectDevice: scanConfig.detectDevice,
      updateDatabase: scanConfig.updateDatabase
    };

    try {
      const scan = await startScanMutation.mutateAsync(config);
      setCurrentScanId(scan.id);
    } catch (error) {
      console.error('Erreur lors du démarrage du scan:', error);
    }
  };

  const stopScan = async () => {
    if (!currentScanId) return;
    
    try {
      await stopScanMutation.mutateAsync(currentScanId);
      setCurrentScanId(null);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du scan:', error);
    }
  };

  const filteredResults = results.filter((result: ScanResult) => {
    const matchesFilter = filter === 'all' || result.status === filter;
    const matchesSearch = !debouncedSearchTerm || 
      result.ip.includes(debouncedSearchTerm) || 
      result.hostname.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (result.vendor && result.vendor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Pagination des résultats de scan
  const [paginatedResults, paginationControls] = usePagination<ScanResult>(filteredResults, 50);

  return (
    <ScanPageContainer>
      <Header>
        <Title>
          🔍 Scanner
        </Title>
      </Header>

      <TopRow>
        {/* Panel des Subnets */}
        <SubnetPanel>
          <PanelTitle>🌐 Subnets & VLANs</PanelTitle>
          
          <AddSubnetButton onClick={() => setShowAddModal(true)}>
            <span>➕</span>
            Ajouter un subnet
          </AddSubnetButton>
          
          {subnetsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
              Chargement des subnets...
            </div>
          ) : subnets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
              Aucun subnet disponible.<br/>
              Ajoutez des pools d'IP dans la section Gestion IP.
            </div>
          ) : (
            <SubnetGrid>
              {subnets.map((subnet) => (
                <SubnetCard
                  key={subnet.id}
                  isSelected={selectedSubnet === subnet.id.toString()}
                  isScanning={isScanning && selectedSubnet === subnet.id.toString()}
                  onClick={() => setSelectedSubnet(subnet.id.toString())}
                >
                  <SubnetHeader>
                    <SubnetName>{subnet.name}</SubnetName>
                    {subnet.vlan_id && <VlanTag>VLAN {subnet.vlan_id}</VlanTag>}
                  </SubnetHeader>
                  
                  <SubnetInfo>
                    <InfoItem>
                      <div className="label">Réseau</div>
                      <div className="value">{subnet.network}/{subnet.cidr}</div>
                    </InfoItem>
                    <InfoItem>
                      <div className="label">Passerelle</div>
                      <div className="value">{subnet.gateway || 'N/A'}</div>
                    </InfoItem>
                    <InfoItem>
                      <div className="label">Organisation</div>
                      <div className="value">{subnet.organization_id}</div>
                    </InfoItem>
                    <InfoItem>
                      <div className="label">Créé le</div>
                      <div className="value">{new Date(subnet.created_at).toLocaleDateString('fr-FR')}</div>
                    </InfoItem>
                  </SubnetInfo>
                  
                  {subnet.description && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      {subnet.description}
                    </div>
                  )}
                  
                  <SubnetStats>
                    <StatBadge type="total">{calculateSubnetTotal(subnet.cidr)} adresses</StatBadge>
                  </SubnetStats>
                  
                  <SubnetActions>
                    <SubnetActionButton
                      variant="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSubnet(subnet.id);
                      }}
                    >
                      ✏️ Modifier
                    </SubnetActionButton>
                    <SubnetActionButton
                      variant="delete"
                      onClick={(e) => handleDeleteSubnet(subnet.id, e)}
                    >
                      🗑️ Supprimer
                    </SubnetActionButton>
                  </SubnetActions>
                </SubnetCard>
              ))}
            </SubnetGrid>
          )}
        </SubnetPanel>

        {/* Panel de Contrôle du Scan */}
        <ScanControlPanel>
          <PanelTitle>⚙️ Configuration du Scan</PanelTitle>
          
          {selectedSubnetData && (
            <div style={{ marginBottom: '20px', padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
              <strong>{selectedSubnetData.name}</strong><br/>
              <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                {selectedSubnetData.network}/{selectedSubnetData.cidr}
              </span>
            </div>
          )}

          <FormGroup>
            <Label>⏱️ Timeout ping (ms)</Label>
            <Select
              value={scanConfig.timeout}
              onChange={(e) => setScanConfig({...scanConfig, timeout: parseInt(e.target.value)})}
              disabled={isScanning}
            >
              <option value="500">500ms - Rapide</option>
              <option value="1000">1000ms - Normal</option>
              <option value="2000">2000ms - Lent</option>
              <option value="5000">5000ms - Très lent</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>🔧 Options de scan</Label>
            <CheckboxGroup>
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={scanConfig.resolveDNS}
                  onChange={(e) => setScanConfig({...scanConfig, resolveDNS: e.target.checked})}
                  disabled={isScanning}
                />
                Résolution DNS
              </CheckboxItem>
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={scanConfig.detectDevice}
                  onChange={(e) => setScanConfig({...scanConfig, detectDevice: e.target.checked})}
                  disabled={isScanning}
                />
                Détecter appareils
              </CheckboxItem>
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={scanConfig.skipPing}
                  onChange={(e) => setScanConfig({...scanConfig, skipPing: e.target.checked})}
                  disabled={isScanning}
                />
                Ignorer ping
              </CheckboxItem>
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={scanConfig.updateDatabase}
                  onChange={(e) => setScanConfig({...scanConfig, updateDatabase: e.target.checked})}
                  disabled={isScanning}
                />
                MAJ base de données
              </CheckboxItem>
            </CheckboxGroup>
          </FormGroup>

          {!isScanning ? (
            <Button 
              variant="primary" 
              onClick={startScan}
              disabled={!selectedSubnet}
            >
              🚀 Démarrer le Scan
            </Button>
          ) : (
            <Button variant="secondary" onClick={stopScan}>
              ⏹️ Arrêter le Scan
            </Button>
          )}

          <Button variant="secondary" disabled={isScanning}>
            💾 Exporter Résultats
          </Button>

          {isScanning && (
            <>
              <ProgressBar progress={scanProgress} isScanning={isScanning} />
              <ScanProgress>
                Scan en cours... {scanProgress}%
              </ScanProgress>
            </>
          )}

          {currentScan && currentScan.status === 'completed' && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <strong>✅ Scan terminé</strong><br/>
              <span style={{ fontSize: '12px', color: '#166534' }}>
                {currentScan.hostsFound} hôtes trouvés
              </span>
            </div>
          )}
        </ScanControlPanel>
      </TopRow>

      {/* Section des Résultats */}
      <ResultsSection>
        <ResultsPanel>
          <PanelTitle>
            📊 Résultats du Scan
            {results.length > 0 && ` (${filteredResults.length}/${results.length})`}
          </PanelTitle>

          {results.length > 0 && (
            <FilterBar>
              <FilterButton 
                isActive={filter === 'all'} 
                onClick={() => setFilter('all')}
              >
                Tous ({results.length})
              </FilterButton>
              <FilterButton 
                isActive={filter === 'online'} 
                onClick={() => setFilter('online')}
              >
                🟢 En ligne ({results.filter((r: ScanResult) => r.status === 'online').length})
              </FilterButton>
              <FilterButton 
                isActive={filter === 'offline'} 
                onClick={() => setFilter('offline')}
              >
                🔴 Hors ligne ({results.filter((r: ScanResult) => r.status === 'offline').length})
              </FilterButton>
              <FilterButton 
                isActive={filter === 'reserved'} 
                onClick={() => setFilter('reserved')}
              >
                🟡 Réservé ({results.filter((r: ScanResult) => r.status === 'reserved').length})
              </FilterButton>
              
              <SearchInput
                type="text"
                placeholder="🔍 Rechercher IP, hostname, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FilterBar>
          )}

          {filteredResults.length === 0 && !isScanning ? (
            <EmptyState>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>Aucun résultat</p>
              <p>Sélectionnez un subnet et lancez un scan</p>
            </EmptyState>
          ) : (
            <>
              <ResultsTable>
                <TableHeader>
                  <div>Adresse IP</div>
                  <div>Nom d'hôte</div>
                  <div>Statut</div>
                  <div>Type d'appareil</div>
                  <div>Constructeur</div>
                  <div>Ping (ms)</div>
                  <div>Dernière vue</div>
                  <div>Actions</div>
                </TableHeader>
                
                {paginatedResults.map((result) => (
                  <TableRow key={result.ip} status={result.status}>
                    <IPAddress>{result.ip}</IPAddress>
                    <HostName>{result.hostname || 'N/A'}</HostName>
                    <StatusBadge status={result.status}>
                      {result.status === 'online' ? '🟢 En ligne' : 
                       result.status === 'offline' ? '🔴 Hors ligne' :
                       result.status === 'reserved' ? '🟡 Réservé' : '⏱️ Timeout'}
                    </StatusBadge>
                    <DeviceType>{result.deviceType || 'Inconnu'}</DeviceType>
                    <span>{result.vendor || 'N/A'}</span>
                    <span>{result.responseTime ? `${result.responseTime}ms` : 'N/A'}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {result.lastSeen ? new Date(result.lastSeen).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                    <ActionButton title="Plus d'actions">⚙️</ActionButton>
                  </TableRow>
                ))}
              </ResultsTable>

              <Pagination 
                controls={paginationControls}
                limitOptions={[25, 50, 100, 200]}
              />
            </>
          )}
        </ResultsPanel>
      </ResultsSection>
      
      {/* Modal d'ajout de subnet */}
      {showAddModal && (
        <ModalOverlay onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddModal(false);
            resetForm();
          }
        }}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Ajouter un nouveau subnet</ModalTitle>
              <CloseButton onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                ×
              </CloseButton>
            </ModalHeader>
            
            <FormGrid>
              <FormGroup>
                <Label>Nom du subnet *</Label>
                <Input
                  type="text"
                  placeholder="Ex: LAN Principal"
                  value={formData.name}
                  hasError={!!formErrors.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {formErrors.name && <ErrorText>{formErrors.name}</ErrorText>}
              </FormGroup>
              
              <FormRow>
                <FormGroup>
                  <Label>Adresse réseau *</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 192.168.1.0"
                    value={formData.network}
                    hasError={!!formErrors.network}
                    onChange={(e) => handleInputChange('network', e.target.value)}
                  />
                  {formErrors.network && <ErrorText>{formErrors.network}</ErrorText>}
                </FormGroup>
                
                <FormGroup>
                  <Label>Masque CIDR *</Label>
                  <Select
                    value={formData.mask}
                    hasError={!!formErrors.mask}
                    onChange={(e) => handleInputChange('mask', parseInt(e.target.value))}
                  >
                    {Array.from({ length: 23 }, (_, i) => i + 8).map(cidr => (
                      <option key={cidr} value={cidr}>
                        /{cidr} ({Math.pow(2, 32 - cidr) - 2} adresses)
                      </option>
                    ))}
                  </Select>
                  {formErrors.mask && <ErrorText>{formErrors.mask}</ErrorText>}
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>Passerelle</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 192.168.1.1"
                    value={formData.gateway}
                    hasError={!!formErrors.gateway}
                    onChange={(e) => handleInputChange('gateway', e.target.value)}
                  />
                  {formErrors.gateway && <ErrorText>{formErrors.gateway}</ErrorText>}
                </FormGroup>
                
                <FormGroup>
                  <Label>VLAN ID</Label>
                  <Input
                    type="number"
                    placeholder="0 (aucun VLAN)"
                    min="0"
                    max="4094"
                    value={formData.vlan}
                    hasError={!!formErrors.vlan}
                    onChange={(e) => handleInputChange('vlan', parseInt(e.target.value) || 0)}
                  />
                  {formErrors.vlan && <ErrorText>{formErrors.vlan}</ErrorText>}
                </FormGroup>
              </FormRow>
              
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  placeholder="Description du subnet (optionnel)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </FormGroup>
            </FormGrid>
            
            <ModalActions>
              <ModalButton 
                variant="secondary" 
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Annuler
              </ModalButton>
              <ModalButton 
                variant="primary" 
                onClick={handleAddSubnet}
                disabled={createSubnetMutation.isPending}
              >
                {createSubnetMutation.isPending ? 'Création...' : 'Créer le subnet'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Modal de modification de subnet */}
      {showEditModal && (
        <ModalOverlay onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEditModal(false);
            setEditingSubnetId(null);
            resetForm();
          }
        }}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Modifier le subnet</ModalTitle>
              <CloseButton onClick={() => {
                setShowEditModal(false);
                setEditingSubnetId(null);
                resetForm();
              }}>
                ×
              </CloseButton>
            </ModalHeader>
            
            <FormGrid>
              <FormGroup>
                <Label>Nom du subnet *</Label>
                <Input
                  type="text"
                  placeholder="Ex: LAN Principal"
                  value={formData.name}
                  hasError={!!formErrors.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {formErrors.name && <ErrorText>{formErrors.name}</ErrorText>}
              </FormGroup>
              
              <FormRow>
                <FormGroup>
                  <Label>Adresse réseau *</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 192.168.1.0"
                    value={formData.network}
                    hasError={!!formErrors.network}
                    onChange={(e) => handleInputChange('network', e.target.value)}
                  />
                  {formErrors.network && <ErrorText>{formErrors.network}</ErrorText>}
                </FormGroup>
                
                <FormGroup>
                  <Label>Masque CIDR *</Label>
                  <Select
                    value={formData.mask}
                    onChange={(e) => handleInputChange('mask', parseInt(e.target.value))}
                  >
                    {Array.from({ length: 23 }, (_, i) => i + 8).map(cidr => (
                      <option key={cidr} value={cidr}>
                        /{cidr} ({Math.pow(2, 32 - cidr) - 2} adresses)
                      </option>
                    ))}
                  </Select>
                  {formErrors.mask && <ErrorText>{formErrors.mask}</ErrorText>}
                </FormGroup>
              </FormRow>
              
              <FormRow>
                <FormGroup>
                  <Label>Passerelle</Label>
                  <Input
                    type="text"
                    placeholder="Ex: 192.168.1.1"
                    value={formData.gateway}
                    hasError={!!formErrors.gateway}
                    onChange={(e) => handleInputChange('gateway', e.target.value)}
                  />
                  {formErrors.gateway && <ErrorText>{formErrors.gateway}</ErrorText>}
                </FormGroup>
                
                <FormGroup>
                  <Label>VLAN ID</Label>
                  <Input
                    type="number"
                    placeholder="0 (aucun VLAN)"
                    min="0"
                    max="4094"
                    value={formData.vlan}
                    hasError={!!formErrors.vlan}
                    onChange={(e) => handleInputChange('vlan', parseInt(e.target.value) || 0)}
                  />
                  {formErrors.vlan && <ErrorText>{formErrors.vlan}</ErrorText>}
                </FormGroup>
              </FormRow>
              
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  placeholder="Description du subnet (optionnel)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </FormGroup>
            </FormGrid>
            
            <ModalActions>
              <ModalButton 
                variant="secondary" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSubnetId(null);
                  resetForm();
                }}
              >
                Annuler
              </ModalButton>
              <ModalButton 
                variant="primary" 
                onClick={handleUpdateSubnet}
                disabled={updateSubnetMutation.isPending}
              >
                {updateSubnetMutation.isPending ? 'Modification...' : 'Modifier le subnet'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </ScanPageContainer>
  );
};

export default ScanPage;