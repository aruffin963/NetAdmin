import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';
import { TenantTheme, ThemeColors } from '../../../../shared/src/types/tenant';

const ThemeCustomizerContainer = styled.div`
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

const ColorSection = styled.div`
  margin-bottom: 32px;
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const ColorInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ColorLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  text-transform: capitalize;
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ColorPicker = styled.input`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: 2px solid #e2e8f0;
    border-radius: 6px;
  }
`;

const ColorValue = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  
  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
`;

const PresetSection = styled.div`
  margin-bottom: 32px;
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const PresetCard = styled.div<{ isActive?: boolean }>`
  border: 2px solid ${props => props.isActive ? '#60a5fa' : '#e2e8f0'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isActive ? '#f0f9ff' : 'white'};
  
  &:hover {
    border-color: #60a5fa;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
`;

const PresetName = styled.h4`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
`;

const PresetColors = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
`;

const PresetColorSwatch = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: ${props => props.color};
  border: 1px solid #e2e8f0;
`;

const PresetDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: #64748b;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: 1px solid ${props => props.variant === 'primary' ? '#60a5fa' : '#e2e8f0'};
  border-radius: 8px;
  background: ${props => props.variant === 'primary' ? '#60a5fa' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#475569'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.variant === 'primary' ? '#3b82f6' : '#f8fafc'};
    border-color: ${props => props.variant === 'primary' ? '#3b82f6' : '#60a5fa'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }
`;

const PreviewSection = styled.div`
  margin-bottom: 32px;
`;

const PreviewCard = styled.div`
  background: var(--color-background, #ffffff);
  color: var(--color-text-primary, #1e293b);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
`;

const PreviewTitle = styled.h4`
  color: var(--color-primary, #60a5fa);
  margin: 0 0 16px 0;
`;

const PreviewButton = styled.button`
  background: var(--color-primary, #60a5fa);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  margin-right: 8px;
  cursor: pointer;
`;

const PreviewSecondaryButton = styled.button`
  background: var(--color-secondary, #34d399);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
`;

interface ThemeCustomizerProps {
  onSave?: (theme: TenantTheme) => void;
  onCancel?: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ onSave, onCancel }) => {
  const { currentTheme, availableThemes, setTheme, applyCustomColors } = useTheme();
  const [customColors, setCustomColors] = useState<Partial<ThemeColors>>(currentTheme.colors);

  const handleColorChange = (colorKey: keyof ThemeColors, value: string) => {
    const updatedColors = { ...customColors, [colorKey]: value };
    setCustomColors(updatedColors);
    applyCustomColors(updatedColors);
  };

  const handlePresetSelect = (theme: TenantTheme) => {
    setTheme(theme);
    setCustomColors(theme.colors);
  };

  const handleSave = () => {
    const updatedTheme: TenantTheme = {
      ...currentTheme,
      colors: { ...currentTheme.colors, ...customColors }
    };
    onSave?.(updatedTheme);
  };

  const colorInputs: { key: keyof ThemeColors; label: string; group: string }[] = [
    { key: 'primary', label: 'Couleur primaire', group: 'Principales' },
    { key: 'secondary', label: 'Couleur secondaire', group: 'Principales' },
    { key: 'accent', label: 'Couleur d\'accent', group: 'Principales' },
    { key: 'background', label: 'Arrière-plan', group: 'Arrière-plans' },
    { key: 'surface', label: 'Surface', group: 'Arrière-plans' },
    { key: 'textPrimary', label: 'Texte principal', group: 'Textes' },
    { key: 'textSecondary', label: 'Texte secondaire', group: 'Textes' },
    { key: 'success', label: 'Succès', group: 'Statuts' },
    { key: 'warning', label: 'Avertissement', group: 'Statuts' },
    { key: 'error', label: 'Erreur', group: 'Statuts' },
    { key: 'border', label: 'Bordure', group: 'Bordures' }
  ];

  const groupedInputs = colorInputs.reduce((acc, input) => {
    if (!acc[input.group]) acc[input.group] = [];
    acc[input.group].push(input);
    return acc;
  }, {} as Record<string, typeof colorInputs>);

  return (
    <ThemeCustomizerContainer>
      <SectionTitle>
        🎨 Personnalisation du Thème
      </SectionTitle>

      {/* Presets */}
      <PresetSection>
        <SectionTitle>🎭 Thèmes Prédéfinis</SectionTitle>
        <PresetGrid>
          {availableThemes.map((theme) => (
            <PresetCard
              key={theme.id}
              isActive={theme.id === currentTheme.id}
              onClick={() => handlePresetSelect(theme)}
            >
              <PresetName>{theme.name}</PresetName>
              <PresetColors>
                <PresetColorSwatch color={theme.colors.primary} />
                <PresetColorSwatch color={theme.colors.secondary} />
                <PresetColorSwatch color={theme.colors.accent} />
                <PresetColorSwatch color={theme.colors.background} />
              </PresetColors>
              <PresetDescription>
                Thème {theme.type === 'light' ? 'clair' : theme.type === 'dark' ? 'sombre' : 'personnalisé'}
              </PresetDescription>
            </PresetCard>
          ))}
        </PresetGrid>
      </PresetSection>

      {/* Aperçu */}
      <PreviewSection>
        <SectionTitle>👁️ Aperçu en Temps Réel</SectionTitle>
        <PreviewCard>
          <PreviewTitle>Exemple de Carte</PreviewTitle>
          <p>Voici un aperçu de votre thème personnalisé appliqué aux composants NetAdmin Pro.</p>
          <PreviewButton>Bouton Principal</PreviewButton>
          <PreviewSecondaryButton>Bouton Secondaire</PreviewSecondaryButton>
        </PreviewCard>
      </PreviewSection>

      {/* Personnalisation des couleurs */}
      <ColorSection>
        <SectionTitle>🌈 Couleurs Personnalisées</SectionTitle>
        {Object.entries(groupedInputs).map(([group, inputs]) => (
          <div key={group}>
            <h4 style={{ marginBottom: '16px', color: '#475569' }}>{group}</h4>
            <ColorGrid>
              {inputs.map(({ key, label }) => (
                <ColorInput key={key as string}>
                  <ColorLabel>{label}</ColorLabel>
                  <ColorPickerWrapper>
                    <ColorPicker
                      type="color"
                      value={customColors[key] || currentTheme.colors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                    />
                    <ColorValue
                      type="text"
                      value={customColors[key] || currentTheme.colors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                    />
                  </ColorPickerWrapper>
                </ColorInput>
              ))}
            </ColorGrid>
          </div>
        ))}
      </ColorSection>

      {/* Actions */}
      <ActionButtons>
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Sauvegarder le Thème
        </Button>
      </ActionButtons>
    </ThemeCustomizerContainer>
  );
};

export default ThemeCustomizer;