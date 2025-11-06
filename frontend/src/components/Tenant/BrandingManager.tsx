import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const BrandingManagerContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UploadSection = styled.div`
  margin-bottom: 32px;
`;

const UploadArea = styled.div<{ isDragOver?: boolean }>`
  border: 2px dashed ${props => props.isDragOver ? '#60a5fa' : '#e2e8f0'};
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  background: ${props => props.isDragOver ? '#f0f9ff' : '#fafafa'};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #60a5fa;
    background: #f0f9ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: #64748b;
`;

const UploadText = styled.p`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
`;

const UploadSubtext = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #64748b;
`;

const UploadButton = styled.button`
  background: #60a5fa;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #3b82f6;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const AssetCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: white;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #60a5fa;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
`;

const AssetPreview = styled.div`
  width: 100%;
  height: 120px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  overflow: hidden;
`;

const AssetImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const AssetPlaceholder = styled.div`
  font-size: 32px;
  color: #cbd5e1;
`;

const AssetInfo = styled.div`
  margin-bottom: 12px;
`;

const AssetName = styled.h4`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
`;

const AssetMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: #64748b;
`;

const AssetActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ variant?: 'danger' }>`
  flex: 1;
  padding: 6px 12px;
  border: 1px solid ${props => props.variant === 'danger' ? '#ef4444' : '#e2e8f0'};
  border-radius: 6px;
  background: ${props => props.variant === 'danger' ? '#fef2f2' : 'white'};
  color: ${props => props.variant === 'danger' ? '#dc2626' : '#475569'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#fee2e2' : '#f8fafc'};
    border-color: ${props => props.variant === 'danger' ? '#dc2626' : '#60a5fa'};
  }
`;

const BrandingForm = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
`;

const ColorPicker = styled.input`
  width: 100%;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  
  &::-webkit-color-swatch-wrapper {
    padding: 4px;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
`;

interface BrandingAsset {
  id: string;
  type: 'logo' | 'favicon' | 'background' | 'icon';
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

interface BrandingSettings {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  appTitle?: string;
  welcomeMessage?: string;
  footerText?: string;
}

interface BrandingManagerProps {
  assets?: BrandingAsset[];
  settings?: BrandingSettings;
  onAssetsChange?: (assets: BrandingAsset[]) => void;
  onSettingsChange?: (settings: BrandingSettings) => void;
}

const BrandingManager: React.FC<BrandingManagerProps> = ({
  assets = [],
  settings = {
    companyName: '',
    primaryColor: '#60a5fa',
    secondaryColor: '#34d399',
    accentColor: '#f59e0b'
  },
  onAssetsChange,
  onSettingsChange
}) => {
  const [currentAssets, setCurrentAssets] = useState<BrandingAsset[]>(assets);
  const [currentSettings, setCurrentSettings] = useState<BrandingSettings>(settings);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion du drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Gestion de l'upload de fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAsset: BrandingAsset = {
          id: Date.now().toString() + Math.random(),
          type: getAssetType(file.name),
          url: e.target?.result as string,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date()
        };
        
        const updatedAssets = [...currentAssets, newAsset];
        setCurrentAssets(updatedAssets);
        onAssetsChange?.(updatedAssets);
      };
      reader.readAsDataURL(file);
    });
  };

  const getAssetType = (filename: string): BrandingAsset['type'] => {
    const name = filename.toLowerCase();
    if (name.includes('logo')) return 'logo';
    if (name.includes('favicon') || name.includes('icon')) return 'favicon';
    if (name.includes('background') || name.includes('bg')) return 'background';
    return 'icon';
  };

  const handleDeleteAsset = (assetId: string) => {
    const updatedAssets = currentAssets.filter(asset => asset.id !== assetId);
    setCurrentAssets(updatedAssets);
    onAssetsChange?.(updatedAssets);
  };

  const handleSettingChange = (key: keyof BrandingSettings, value: string) => {
    const updatedSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (type: BrandingAsset['type']): string => {
    switch (type) {
      case 'logo': return '🏢';
      case 'favicon': return '⭐';
      case 'background': return '🖼️';
      case 'icon': return '🎨';
      default: return '📄';
    }
  };

  return (
    <BrandingManagerContainer>
      <SectionTitle>
        🎨 Gestion du Branding
      </SectionTitle>

      {/* Upload d'assets */}
      <UploadSection>
        <SectionTitle>📤 Upload d'Assets</SectionTitle>
        <UploadArea
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon>🖼️</UploadIcon>
          <UploadText>Glissez-déposez vos fichiers ici</UploadText>
          <UploadSubtext>
            Formats supportés: PNG, JPG, SVG • Taille max: 5 MB
          </UploadSubtext>
          <UploadButton>
            Parcourir les fichiers
          </UploadButton>
          <HiddenInput
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
          />
        </UploadArea>
      </UploadSection>

      {/* Assets existants */}
      {currentAssets.length > 0 && (
        <div>
          <SectionTitle>🖼️ Assets Existants</SectionTitle>
          <AssetGrid>
            {currentAssets.map((asset) => (
              <AssetCard key={asset.id}>
                <AssetPreview>
                  {asset.url ? (
                    <AssetImage src={asset.url} alt={asset.filename} />
                  ) : (
                    <AssetPlaceholder>
                      {getAssetIcon(asset.type)}
                    </AssetPlaceholder>
                  )}
                </AssetPreview>
                <AssetInfo>
                  <AssetName>{asset.filename}</AssetName>
                  <AssetMeta>
                    {asset.type.toUpperCase()} • {formatFileSize(asset.size)}
                  </AssetMeta>
                </AssetInfo>
                <AssetActions>
                  <ActionButton>Utiliser</ActionButton>
                  <ActionButton variant="danger" onClick={() => handleDeleteAsset(asset.id)}>
                    Supprimer
                  </ActionButton>
                </AssetActions>
              </AssetCard>
            ))}
          </AssetGrid>
        </div>
      )}

      {/* Configuration du branding */}
      <div>
        <SectionTitle>⚙️ Configuration du Branding</SectionTitle>
        <BrandingForm>
          <FormGroup>
            <Label>Nom de l'entreprise</Label>
            <Input
              type="text"
              value={currentSettings.companyName}
              onChange={(e) => handleSettingChange('companyName', e.target.value)}
              placeholder="Votre Entreprise"
            />
          </FormGroup>

          <FormGroup>
            <Label>Titre de l'application</Label>
            <Input
              type="text"
              value={currentSettings.appTitle || ''}
              onChange={(e) => handleSettingChange('appTitle', e.target.value)}
              placeholder="NetAdmin Pro"
            />
          </FormGroup>

          <FormGroup>
            <Label>Couleur primaire</Label>
            <ColorPicker
              type="color"
              value={currentSettings.primaryColor}
              onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Couleur secondaire</Label>
            <ColorPicker
              type="color"
              value={currentSettings.secondaryColor}
              onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Couleur d'accent</Label>
            <ColorPicker
              type="color"
              value={currentSettings.accentColor}
              onChange={(e) => handleSettingChange('accentColor', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Message de bienvenue</Label>
            <Input
              type="text"
              value={currentSettings.welcomeMessage || ''}
              onChange={(e) => handleSettingChange('welcomeMessage', e.target.value)}
              placeholder="Bienvenue sur votre tableau de bord réseau"
            />
          </FormGroup>

          <FormGroup>
            <Label>Texte du pied de page</Label>
            <Input
              type="text"
              value={currentSettings.footerText || ''}
              onChange={(e) => handleSettingChange('footerText', e.target.value)}
              placeholder="© 2025 Votre Entreprise. Tous droits réservés."
            />
          </FormGroup>
        </BrandingForm>
      </div>
    </BrandingManagerContainer>
  );
};

export default BrandingManager;