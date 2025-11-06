import React, { useState } from 'react';
import styled from 'styled-components';
import { AdvancedSubnetCalculator } from './AdvancedSubnetCalculator';
import { SimpleVLSMPlanner } from './SimpleVLSMPlanner';

type PlannerMode = 'subnet' | 'vlsm';

const UnifiedNetworkPlanner: React.FC<{ onResultChange?: (result: any) => void }> = ({ onResultChange }) => {
  const [activeMode, setActiveMode] = useState<PlannerMode>('subnet');

  return (
    <Container>
      {/* En-tête avec sélection du mode */}
      <PlannerHeader>
        <HeaderTitle>Planificateur Réseau Unifié</HeaderTitle>
        <HeaderSubtitle>
          Calculateur de sous-réseaux et planificateur VLSM dans un seul outil
        </HeaderSubtitle>
        
        <ModeSelector>
          <ModeTab 
            active={activeMode === 'subnet'}
            onClick={() => setActiveMode('subnet')}
          >
            🔢 Calculateur CIDR
          </ModeTab>
          <ModeTab 
            active={activeMode === 'vlsm'}
            onClick={() => setActiveMode('vlsm')}
          >
            🌐 Planificateur VLSM
          </ModeTab>
        </ModeSelector>
      </PlannerHeader>

      {/* Description du mode actuel */}
      <ModeDescription>
        {activeMode === 'subnet' ? (
          <DescriptionCard>
            <DescriptionIcon>🔢</DescriptionIcon>
            <DescriptionContent>
              <DescriptionTitle>Calculateur de Sous-réseaux CIDR</DescriptionTitle>
              <DescriptionText>
                Créez des sous-réseaux uniformes à partir d'un réseau principal. 
                Parfait pour segmenter un réseau en sous-réseaux de taille égale 
                avec un nombre défini d'hôtes ou de sous-réseaux.
              </DescriptionText>
              <FeatureList>
                <Feature>✓ Sous-réseaux de taille égale</Feature>
                <Feature>✓ Calcul par nombre de sous-réseaux ou d'hôtes</Feature>
                <Feature>✓ Export détaillé des résultats</Feature>
              </FeatureList>
            </DescriptionContent>
          </DescriptionCard>
        ) : (
          <DescriptionCard>
            <DescriptionIcon>🌐</DescriptionIcon>
            <DescriptionContent>
              <DescriptionTitle>Planificateur VLSM (Variable Length Subnet Masking)</DescriptionTitle>
              <DescriptionText>
                Optimisez l'utilisation de votre espace d'adressage en créant 
                des sous-réseaux de tailles variables adaptées aux besoins 
                spécifiques de chaque segment.
              </DescriptionText>
              <FeatureList>
                <Feature>✓ Sous-réseaux de tailles variables</Feature>
                <Feature>✓ Optimisation de l'espace d'adressage</Feature>
                <Feature>✓ Allocation intelligente des plages</Feature>
              </FeatureList>
            </DescriptionContent>
          </DescriptionCard>
        )}
      </ModeDescription>

      {/* Contenu du planificateur */}
      <PlannerContent>
        {activeMode === 'subnet' ? (
          <AdvancedSubnetCalculator onResultChange={onResultChange} />
        ) : (
          <SimpleVLSMPlanner />
        )}
      </PlannerContent>

      {/* Section d'aide et conseils */}
      <HelpSection>
        <HelpTitle>💡 Conseils d'utilisation</HelpTitle>
        <HelpGrid>
          {activeMode === 'subnet' ? (
            <>
              <HelpCard>
                <HelpCardTitle>Calcul par sous-réseaux</HelpCardTitle>
                <HelpCardText>
                  Utilisez ce mode quand vous savez combien de segments 
                  vous voulez créer. Ideal pour des réseaux d'entreprise 
                  avec des départements définis.
                </HelpCardText>
              </HelpCard>
              <HelpCard>
                <HelpCardTitle>Calcul par hôtes</HelpCardTitle>
                <HelpCardText>
                  Choisissez ce mode quand vous connaissez le nombre 
                  d'appareils par segment. Parfait pour dimensionner 
                  selon les besoins techniques.
                </HelpCardText>
              </HelpCard>
              <HelpCard>
                <HelpCardTitle>Export des résultats</HelpCardTitle>
                <HelpCardText>
                  Exportez vos calculs en CSV pour documentation, 
                  partage avec l'équipe ou intégration dans vos 
                  outils de gestion réseau.
                </HelpCardText>
              </HelpCard>
            </>
          ) : (
            <>
              <HelpCard>
                <HelpCardTitle>Optimisation VLSM</HelpCardTitle>
                <HelpCardText>
                  VLSM permet d'utiliser efficacement l'espace 
                  d'adressage en attribuant la taille exacte 
                  nécessaire à chaque sous-réseau.
                </HelpCardText>
              </HelpCard>
              <HelpCard>
                <HelpCardTitle>Ordre de création</HelpCardTitle>
                <HelpCardText>
                  Commencez toujours par les sous-réseaux nécessitant 
                  le plus d'hôtes pour optimiser l'allocation 
                  et éviter la fragmentation.
                </HelpCardText>
              </HelpCard>
              <HelpCard>
                <HelpCardTitle>Planification réseau</HelpCardTitle>
                <HelpCardText>
                  Planifiez vos besoins futurs et ajoutez une marge 
                  de croissance (20-30%) pour éviter de refaire 
                  l'adressage plus tard.
                </HelpCardText>
              </HelpCard>
            </>
          )}
        </HelpGrid>
      </HelpSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const PlannerHeader = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 16px;
  color: #64748b;
  margin: 0 0 24px 0;
`;

const ModeSelector = styled.div`
  display: flex;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  max-width: 400px;
`;

const ModeTab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)' : 
    'transparent'};
  color: ${props => props.active ? 'white' : '#64748b'};
  box-shadow: ${props => props.active ? 
    '0 2px 8px rgba(96, 165, 250, 0.3)' : 
    'none'};

  &:hover {
    color: ${props => props.active ? 'white' : '#1e293b'};
    background: ${props => props.active ? 
      'linear-gradient(135deg, #34d399 0%, #60a5fa 100%)' : 
      '#f8fafc'};
  }
`;

const ModeDescription = styled.div`
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
`;

const DescriptionCard = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

const DescriptionIcon = styled.div`
  font-size: 48px;
  line-height: 1;
`;

const DescriptionContent = styled.div`
  flex: 1;
`;

const DescriptionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const DescriptionText = styled.p`
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
`;

const FeatureList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const Feature = styled.span`
  font-size: 14px;
  color: #059669;
  font-weight: 500;
`;

const PlannerContent = styled.div`
  padding: 24px;
`;

const HelpSection = styled.div`
  background: #f8fafc;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
`;

const HelpTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
`;

const HelpGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const HelpCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
`;

const HelpCardTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const HelpCardText = styled.p`
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
`;

export { UnifiedNetworkPlanner };