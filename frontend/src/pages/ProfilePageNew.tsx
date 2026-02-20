import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 50%, ${colors.background.primary} 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: fixed;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
    top: -300px;
    right: -300px;
    border-radius: 50%;
    animation: float 15s ease-in-out infinite;
    z-index: 0;
  }

  &::after {
    content: '';
    position: fixed;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
    bottom: -200px;
    left: -200px;
    border-radius: 50%;
    animation: float 20s ease-in-out infinite reverse;
    z-index: 0;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(50px); }
  }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const HeroSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 40px;
  margin-bottom: 60px;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const ProfileCard = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid ${colors.border.light};
  border-radius: 30px;
  padding: 60px 40px;
  overflow: hidden;
  animation: slideInLeft 0.8s ease-out;

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-60px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.primary.blueLight}, transparent);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, transparent 100%);
    pointer-events: none;
  }
`;

const AvatarSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 2;
`;

const AvatarCircle = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: ${colors.primary.blue};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  font-weight: 900;
  color: ${colors.text.white};
  margin: 0 auto 24px;
  box-shadow: 0 25px 60px ${colors.shadow.lg}, inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  animation: pulse 3s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { box-shadow: 0 25px 60px ${colors.shadow.lg}, inset 0 1px 0 rgba(255, 255, 255, 0.2); }
    50% { box-shadow: 0 25px 80px ${colors.shadow.lg}, inset 0 1px 0 rgba(255, 255, 255, 0.3); }
  }
`;

const UserName = styled.h1`
  font-size: 32px;
  font-weight: 900;
  color: ${colors.text.primary};
  margin: 0 0 8px 0;
`;

const UserEmail = styled.p`
  color: ${colors.text.secondary};
  font-size: 15px;
  margin: 0 0 20px 0;
  font-family: 'Monaco', monospace;
`;

const Badge = styled.span`
  display: inline-block;
  background: ${colors.primary.blue};
  color: ${colors.text.white};
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
`;

const InfoPanel = styled.div`
  animation: slideInRight 0.8s ease-out;  color: ${colors.text.primary};
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(60px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: 900;
  color: ${colors.text.primary};
  margin: 80px 0 40px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, ${colors.primary.blueLight}, transparent);
    margin-left: 20px;
  }
`;

const GridSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid ${colors.border.light};
  border-radius: 20px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out;
  color: ${colors.text.primary};

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.primary.blue}, transparent);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.98);
    border-color: ${colors.primary.blue};
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  }

  &:hover .FeatureIcon {
    transform: scale(1.2) rotate(10deg);
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
`;

const FeatureTitle = styled.h3`
  color: ${colors.text.primary};
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FeatureDescription = styled.p`
  color: ${colors.text.secondary};
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background: ${colors.primary.blue};
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(37, 99, 235, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${colors.background.primary};
  border: 1px solid ${colors.border.light};
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 100px rgba(0, 0, 0, 0.15);
  color: ${colors.text.primary};
`;

const ModalTitle = styled.h2`
  color: ${colors.text.primary};
  font-size: 24px;
  margin: 0 0 24px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 900;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  color: ${colors.text.primary};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  font-weight: 700;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 18px;
  background: ${colors.background.secondary};
  border: 1px solid ${colors.border.light};
  border-radius: 12px;
  color: ${colors.text.primary};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    background: ${colors.background.primary};
    border-color: ${colors.primary.blue};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: ${colors.text.tertiary};
  }
`;

const PasswordStrengthBar = styled.div<{ strength: number }>`
  height: 6px;
  border-radius: 3px;
  background: ${colors.background.secondary};
  overflow: hidden;
  margin-top: 8px;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.strength}%;
    background: ${props => {
      if (props.strength < 40) return colors.semantic.danger;
      if (props.strength < 70) return colors.semantic.warning;
      return colors.semantic.success;
    }};
    transition: all 0.3s ease;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${colors.primary.blue};
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(37, 99, 235, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============= MAIN COMPONENT =============

export const ProfilePageNew: React.FC = () => {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [, setProfileData] = useState({
    loginCount: 0,
    lastLogin: new Date(),
    createdAt: new Date(),
    twoFactorEnabled: false,
    alertsCount: 0,
    securityScore: 0,
    location: 'N/A',
    sessionDuration: 0,
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Récupérer les données utilisateur et activité
        const [userResponse, activityResponse] = await Promise.all([
          apiClient.get('/api/auth/me'),
          apiClient.get('/api/activity-logs?limit=100'),
        ]) as [{ data: { user: any } }, { data: { logs: any[] } }];

        const currentUser = userResponse.data.user;
        const logs = activityResponse.data.logs || [];
        setActivityLogs(logs);

        // Compter les connexions
        const loginLogs = logs.filter((log: any) => log.action === 'LOGIN');
        const loginCount = loginLogs.length;

        // Dernier accès
        const lastLoginLog = loginLogs[0];
        const lastLogin = lastLoginLog ? new Date(lastLoginLog.createdAt) : new Date();

        // Date de création du compte
        const createdAt = new Date(currentUser.createdAt);

        // 2FA activé
        const twoFactorEnabled = currentUser.twoFactorEnabled || false;

        // Nombre d'alertes (compter les logs avec status WARNING ou CRITICAL)
        const alertsCount = logs.filter(
          (log: any) => log.status === 'WARNING' || log.status === 'CRITICAL'
        ).length;

        // Calculer le score de sécurité (0-100)
        let securityScore = 50; // Base
        if (twoFactorEnabled) securityScore += 30;
        if (loginCount > 0) securityScore += 10;
        if (alertsCount === 0) securityScore += 10;
        securityScore = Math.min(securityScore, 100);

        // Localisation basée sur les infos de la dernière connexion
        const location = lastLoginLog?.details?.userAgent ? 'Web Browser' : 'N/A';

        // Durée de session (basée sur la dernière activité)
        const lastActivity = logs[0];
        const sessionDuration = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / 1000)
          : 0;

        setProfileData({
          loginCount,
          lastLogin,
          createdAt,
          twoFactorEnabled,
          alertsCount,
          securityScore,
          location,
          sessionDuration,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données du profil:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const getInitials = () => {
    return (user?.username || 'U').substring(0, 2).toUpperCase();
  };

  const updatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    // TODO: API call to change password
    setShowPasswordModal(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: { label: string; emoji: string } } = {
      'LOGIN': { emoji: '🔓', label: 'Connexion' },
      'LOGOUT': { emoji: '🚪', label: 'Déconnexion' },
      'LOGOUT_MONITOR': { emoji: '🚪', label: 'Déconnexion Monitoring' },
      'CHANGE_PASSWORD': { emoji: '🔐', label: 'Changement mot de passe' },
      'API_CALL': { emoji: '🔗', label: 'Appel API' },
      'TWO_FACTOR_ENABLE': { emoji: '🛡️', label: '2FA Activé' },
      'TWO_FACTOR_DISABLE': { emoji: '⚠️', label: '2FA Désactivé' },
    };
    return labels[action] || { emoji: '📌', label: action };
  };

  return (
    <Container>
      <Content>
        {/* HERO SECTION */}
        <HeroSection>
          <ProfileCard>
            <AvatarSection>
              <AvatarCircle>{getInitials()}</AvatarCircle>
              <UserName>{user?.username}</UserName>
              <UserEmail>{user?.email}</UserEmail>
              <Badge>👑 ADMINISTRATEUR</Badge>
            </AvatarSection>

            <StatsGrid>
              {/* <StatBox>
                <StatValue>{formatMemberSince(profileData.createdAt)}</StatValue>
                <StatLabel>Membre depuis</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue>{profileData.loginCount}</StatValue>
                <StatLabel>Connexions</StatLabel>
              </StatBox>
              <StatBox>
                <StatValue>{profileData.alertsCount}</StatValue>
                <StatLabel>Alertes</StatLabel>
              </StatBox> */}
            </StatsGrid>
          </ProfileCard>

          <InfoPanel>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: colors.text.primary, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px 0' }}>
                📋 Activités Récentes
              </h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {activityLogs.slice(0, 5).map((log, index) => {
                  const actionInfo = getActionLabel(log.action);
                  
                  return (
                    <div key={index} style={{
                      padding: '14px',
                      background: index % 2 === 0 ? 'rgba(37, 99, 235, 0.03)' : 'transparent',
                      borderBottom: `1px solid ${colors.border.light}`,
                      borderRadius: '8px',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0, fontSize: '13px' }}>
                            {actionInfo.emoji} {actionInfo.label}
                          </p>
                        </div>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: log.status === 'SUCCESS' ? colors.semantic.success : log.status === 'WARNING' ? colors.semantic.warning : colors.semantic.danger,
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>
                          {log.status}
                        </span>
                      </div>
                      <p style={{ color: colors.text.tertiary, fontSize: '11px', margin: '6px 0 0 0' }}>
                        {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </InfoPanel>
        </HeroSection>

        {/* SECURITY SECTION */}
        <SectionTitle>🛡️ Sécurité & Confidentialité</SectionTitle>
        <GridSection>
          <FeatureCard>
            <FeatureIcon>🔐</FeatureIcon>
            <FeatureTitle>Mot de Passe</FeatureTitle>
            <FeatureDescription>Modifier votre mot de passe de façon sécurisée</FeatureDescription>
            <ActionButton onClick={() => setShowPasswordModal(true)}>Changer</ActionButton>
          </FeatureCard>
{/* 
          <FeatureCard>
            <FeatureIcon>🔑</FeatureIcon>
            <FeatureTitle>Clés d'API</FeatureTitle>
            <FeatureDescription>Gérer vos clés API et tokens d'authentification</FeatureDescription>
            <ActionButton onClick={() => setShowApiKeysModal(true)}>Gérer les Clés</ActionButton>
          </FeatureCard> */}

          {/* <FeatureCard>
            <FeatureIcon>📱</FeatureIcon>
            <FeatureTitle>Appareils Connectés</FeatureTitle>
            <FeatureDescription>Voir et gérer vos appareils connectés</FeatureDescription>
            <ActionButton onClick={() => setShowDevicesModal(true)}>Voir les Appareils</ActionButton>
          </FeatureCard> */}
{/* 
          <FeatureCard>
            <FeatureIcon>📋</FeatureIcon>
            <FeatureTitle>Historique</FeatureTitle>
            <FeatureDescription>Consulter vos dernières activités et connexions</FeatureDescription>
            <ActionButton onClick={() => setShowHistoryModal(true)}>Voir l'Historique</ActionButton>
          </FeatureCard> */}

          <FeatureCard>
            <FeatureIcon>🔔</FeatureIcon>
            <FeatureTitle>Notifications</FeatureTitle>
            <FeatureDescription>Gérer vos préférences de notifications</FeatureDescription>
            <ActionButton onClick={() => setShowNotificationsModal(true)}>Paramètres</ActionButton>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>⚙️</FeatureIcon>
            <FeatureTitle>Paramètres Avancés</FeatureTitle>
            <FeatureDescription>Configuration de sécurité avancée et options</FeatureDescription>
            <ActionButton onClick={() => setShowAdvancedModal(true)}>Configurer</ActionButton>
          </FeatureCard>
        </GridSection>

        {/* SECURITY SCORE */}
        {/* <SectionTitle>📊 Score de Sécurité</SectionTitle>
        <SecurityScore>
          <ScoreCircle score={profileData.securityScore}>
            <span>{profileData.securityScore}</span>
            <span>/ 100</span>
          </ScoreCircle>
          <h3 style={{ color: colors.text.primary, fontSize: '20px', fontWeight: 900 }}>
            {profileData.securityScore >= 80 ? 'Excellent' : profileData.securityScore >= 60 ? 'Bon' : 'À améliorer'}
          </h3>
          <p style={{ color: colors.text.secondary, marginTop: 12 }}>
            {profileData.securityScore >= 80
              ? 'Votre compte est bien sécurisé. Continuez à maintenir les bonnes pratiques.'
              : profileData.securityScore >= 60
              ? 'Votre compte a un bon niveau de sécurité. Considérez d\'activer 2FA.'
              : 'Améliorez la sécurité de votre compte en activant 2FA et en changeant votre mot de passe.'}
          </p>
        </SecurityScore> */}
      </Content>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <ModalOverlay onClick={() => setShowPasswordModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>🔐 Changer le Mot de Passe</ModalTitle>
            <form onSubmit={handlePasswordChange}>
              <FormGroup>
                <Label>Mot de Passe Actuel</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Nouveau Mot de Passe</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.new}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, new: e.target.value });
                    updatePasswordStrength(e.target.value);
                  }}
                  required
                />
                <PasswordStrengthBar strength={passwordStrength} />
              </FormGroup>

              <FormGroup>
                <Label>Confirmer le Mot de Passe</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  required
                />
              </FormGroup>

              <SubmitButton type="submit">Mettre à Jour</SubmitButton>
            </form>
          </Modal>
        </ModalOverlay>
      )}

      {/* API KEYS MODAL */}
      {showApiKeysModal && (
        <ModalOverlay onClick={() => setShowApiKeysModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>🔑 Clés d'API</ModalTitle>
            <p style={{ color: colors.text.secondary, marginTop: 16 }}>
              Vos clés API vous permettent d'authentifier les requêtes de votre application.
            </p>
            <div style={{ marginTop: 24 }}>
              <p style={{ color: colors.text.primary, fontWeight: 600 }}>Clés Active</p>
              <div style={{ padding: '12px', background: colors.background.secondary, borderRadius: '8px', marginTop: 12, fontFamily: 'monospace', color: colors.text.secondary, fontSize: '12px' }}>
                sk_live_abcd1234efgh5678...
              </div>
              <p style={{ color: colors.text.secondary, fontSize: '12px', marginTop: 8 }}>Créée le 15 février 2026</p>
            </div>
            <ActionButton onClick={() => setShowApiKeysModal(false)} style={{ marginTop: 24 }}>Générer une Nouvelle Clé</ActionButton>
            <ActionButton onClick={() => setShowApiKeysModal(false)} style={{ marginTop: 12, background: colors.semantic.danger }}>Révoquer</ActionButton>
          </Modal>
        </ModalOverlay>
      )}

      {/* DEVICES MODAL */}
      {showDevicesModal && (
        <ModalOverlay onClick={() => setShowDevicesModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>📱 Appareils Connectés</ModalTitle>
            <div style={{ marginTop: 24 }}>
              <div style={{ padding: '16px', background: colors.background.secondary, borderRadius: '12px', marginBottom: 12, borderLeft: `4px solid ${colors.primary.blue}` }}>
                <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0 }}>💻 Windows Chrome</p>
                <p style={{ color: colors.text.secondary, fontSize: '12px', margin: '8px 0 0 0' }}>Connecté il y a 2 minutes</p>
                <p style={{ color: colors.text.tertiary, fontSize: '11px', margin: '4px 0 0 0' }}>IP: 192.168.1.100</p>
              </div>
              <div style={{ padding: '16px', background: colors.background.secondary, borderRadius: '12px', marginBottom: 12, borderLeft: `4px solid ${colors.semantic.success}` }}>
                <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0 }}>📱 iPhone Safari</p>
                <p style={{ color: colors.text.secondary, fontSize: '12px', margin: '8px 0 0 0' }}>Connecté il y a 4 heures</p>
                <p style={{ color: colors.text.tertiary, fontSize: '11px', margin: '4px 0 0 0' }}>IP: 192.168.1.105</p>
              </div>
            </div>
            <SubmitButton onClick={() => setShowDevicesModal(false)}>Fermer</SubmitButton>
          </Modal>
        </ModalOverlay>
      )}

      {/* ACTIVITY HISTORY MODAL */}
      {showHistoryModal && (
        <ModalOverlay onClick={() => setShowHistoryModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>📋 Historique d'Activité</ModalTitle>
            <div style={{ marginTop: 16, maxHeight: '400px', overflowY: 'auto' }}>
              {activityLogs.slice(0, 10).map((log, index) => (
                <div key={index} style={{ padding: '12px', borderBottom: `1px solid ${colors.border.light}`, fontSize: '13px' }}>
                  <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0 }}>
                    {log.action} - {log.resourceType}
                  </p>
                  <p style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}>
                    {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {log.details && (
                    <p style={{ color: colors.text.tertiary, fontSize: '11px', margin: '2px 0 0 0' }}>
                      {JSON.stringify(log.details).substring(0, 60)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
            <SubmitButton onClick={() => setShowHistoryModal(false)}>Fermer</SubmitButton>
          </Modal>
        </ModalOverlay>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <ModalOverlay onClick={() => setShowNotificationsModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>🔔 Préférences de Notifications</ModalTitle>
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, padding: '12px', background: colors.background.secondary, borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: '20px', height: '20px', cursor: 'pointer', marginRight: 12 }}
                />
                <div>
                  <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0 }}>Alertes de Sécurité</p>
                  <p style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}>Recevoir les notifications de sécurité importantes</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, padding: '12px', background: colors.background.secondary, borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: '20px', height: '20px', cursor: 'pointer', marginRight: 12 }}
                />
                <div>
                  <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0 }}>Nouvelles Connexions</p>
                  <p style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}>Alerter sur les nouvelles connexions à votre compte</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, padding: '12px', background: colors.background.secondary, borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer', marginRight: 12 }}
                />
                <div>
                  <p style={{ color: colors.text.primary, fontWeight: 600, margin: 0 }}>Mises à Jour Système</p>
                  <p style={{ color: colors.text.secondary, fontSize: '12px', margin: '4px 0 0 0' }}>Recevoir les notifications de mises à jour</p>
                </div>
              </div>
            </div>
            <SubmitButton onClick={() => setShowNotificationsModal(false)}>Enregistrer</SubmitButton>
          </Modal>
        </ModalOverlay>
      )}

      {/* ADVANCED SETTINGS MODAL */}
      {showAdvancedModal && (
        <ModalOverlay onClick={() => setShowAdvancedModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>⚙️ Paramètres Avancés</ModalTitle>
            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: colors.text.primary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Authentification Forte
                </label>
                <select style={{
                  width: '100%',
                  padding: '10px',
                  background: colors.background.secondary,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: '8px',
                  color: colors.text.primary,
                }}>
                  <option>Activée</option>
                  <option>Désactivée</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: colors.text.primary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Timeout de Session (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={30}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: colors.background.secondary,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: '8px',
                    color: colors.text.primary,
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: colors.text.primary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  IP Whitelist
                </label>
                <textarea
                  placeholder="Une IP par ligne"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: colors.background.secondary,
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: '8px',
                    color: colors.text.primary,
                    fontFamily: 'monospace',
                    minHeight: '100px',
                  }}
                />
              </div>
            </div>
            <SubmitButton onClick={() => setShowAdvancedModal(false)}>Enregistrer les Modifications</SubmitButton>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default ProfilePageNew;
