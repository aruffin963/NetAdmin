import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { apiClient } from '../services/api';

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
    top: -200px;
    right: -200px;
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
    border-radius: 50%;
    animation: float 8s ease-in-out infinite reverse;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(30px); }
  }

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 50px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: slideDown 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
`;

const Avatar = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 56px;
  font-weight: 900;
  flex-shrink: 0;
  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shine 3s infinite;
  }

  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
    font-size: 48px;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Title = styled.h1`
  margin: 0 0 12px 0;
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(135deg, #ffffff 0%, #a8dadc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  font-weight: 500;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 50px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  padding: 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  animation: slideUp 0.6s ease-out 0.1s both;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 12px 28px;
  border: none;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
    : 'transparent'
  };
  color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  ${props => !props.active && `
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }
  `}

  ${props => props.active && `
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%);
      animation: shine 3s infinite;
    }
  `}
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 30px;
  animation: fadeInUp 0.6s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const CardTitle = styled.h2`
  margin: 0 0 32px 0;
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.5), transparent);
  }
`;

const Grid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 2}, 1fr);
  gap: 24px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  animation: fadeInUp 0.6s ease-out;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-weight: 500;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.8);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.03);
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.4);
  }

  &.error {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
`;

const PasswordStrength = styled.div`
  margin-top: 16px;
`;

const StrengthBar = styled.div<{ strength: number }>`
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-bottom: 8px;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.strength}%;
    background: ${props => {
      if (props.strength < 40) return 'linear-gradient(90deg, #ff6b6b, #ff8787)';
      if (props.strength < 70) return 'linear-gradient(90deg, #ffa502, #ffb347)';
      return 'linear-gradient(90deg, #52c41a, #85ce61)';
    }};
    transition: all 0.3s ease;
    border-radius: 4px;
    box-shadow: 0 0 10px ${props => {
      if (props.strength < 40) return 'rgba(255, 107, 107, 0.4)';
      if (props.strength < 70) return 'rgba(255, 165, 2, 0.4)';
      return 'rgba(82, 196, 26, 0.4)';
    }};
  }
`;

const StrengthText = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RequirementsList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RequirementItem = styled.li<{ met: boolean }>`
  font-size: 13px;
  color: ${props => props.met ? '#52c41a' : 'rgba(255, 255, 255, 0.4)'};
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;

  &:before {
    content: '${props => props.met ? '✓' : '✗'}';
    font-weight: 900;
    font-size: 14px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shine 3s infinite;
    opacity: 0;
  }

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
          
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
            &::before { opacity: 1; }
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          color: white;
          box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
          
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 15px 40px rgba(255, 107, 107, 0.5);
            &::before { opacity: 1; }
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          
          &:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(59, 130, 246, 0.5);
            transform: translateY(-4px);
          }
        `;
    }
  }}

  &:disabled {
    background: rgba(255, 255, 255, 0.05);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.5;
  }
`;

const Badge = styled.span<{ status: 'success' | 'danger' | 'info' }>`
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${props => {
    switch (props.status) {
      case 'success':
        return `
          background: rgba(82, 196, 26, 0.2);
          color: #52c41a;
          border: 1px solid rgba(82, 196, 26, 0.3);
        `;
      case 'danger':
        return `
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.3);
        `;
      default:
        return `
          background: rgba(59, 130, 246, 0.2);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
    }
  }}
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    text-align: left;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  tr:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Notification = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border-left: 4px solid;
  backdrop-filter: blur(10px);
  background: ${props => {
    switch (props.type) {
      case 'success':
        return 'rgba(82, 196, 26, 0.15)';
      case 'error':
        return 'rgba(255, 107, 107, 0.15)';
      default:
        return 'rgba(59, 130, 246, 0.15)';
    }
  }};
  border-color: ${props => {
    switch (props.type) {
      case 'success':
        return '#52c41a';
      case 'error':
        return '#ff6b6b';
      default:
        return '#3b82f6';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success':
        return '#95de64';
      case 'error':
        return '#ff8787';
      default:
        return '#91caff';
    }
  }};
  font-weight: 600;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);

  div:first-child {
    font-size: 56px;
    margin-bottom: 16px;
  }
`;

// ============= MAIN COMPONENT =============

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  // Profile state
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: 'Administrateur Réseau',
    department: 'IT Infrastructure',
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Login history state
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    notifications: 'all',
    autoLogout: '30',
  });

  // Load login history when component mounts or security tab is selected
  useEffect(() => {
    if (activeTab === 'security') {
      loadLoginHistory();
    }
  }, [activeTab]);

  // Load login history
  const loadLoginHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await apiClient.get('/auth/login-history?limit=20');
      if (response.success) {
        setLoginHistory(response.data || []);
      }
    } catch (error: any) {
      showNotification('Erreur lors du chargement de l\'historique', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Update password requirements
  const updatePasswordRequirements = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    });
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    const met = Object.values(passwordRequirements).filter(Boolean).length;
    return (met / 5) * 100;
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'Faible';
    if (strength < 80) return 'Moyen';
    return 'Forte';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (!Object.values(passwordRequirements).every(Boolean)) {
      showNotification('Le mot de passe ne répond pas aux exigences', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        showNotification('Mot de passe changé avec succès !', 'success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        showNotification(response.message || 'Erreur lors du changement de mot de passe', 'error');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur serveur';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = () => {
    return (user?.username || 'U').substring(0, 2).toUpperCase();
  };

  return (
    <Container>
      <Content>
        {/* Header */}
        <Header>
          <Avatar>{getInitials()}</Avatar>
          <HeaderInfo>
            <Title>Profil Utilisateur</Title>
            <Subtitle>{user?.email}</Subtitle>
          </HeaderInfo>
        </Header>

        {/* Notification */}
        {notification.show && (
          <Notification type={notification.type}>
            {notification.message}
          </Notification>
        )}

        {/* Tabs */}
        <TabsContainer>
          <TabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profil
          </TabButton>
          <TabButton
            active={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          >
            🔐 Sécurité
          </TabButton>
          <TabButton
            active={activeTab === 'preferences'}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Paramètres
          </TabButton>
        </TabsContainer>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardTitle>📋 Informations Personnelles</CardTitle>
            <Grid columns={2}>
              <FormGroup>
                <Label>Nom d'utilisateur</Label>
                <Input
                  type="text"
                  value={profile.username}
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label>Rôle</Label>
                <Input
                  type="text"
                  value={profile.role}
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label>Département</Label>
                <Input
                  type="text"
                  value={profile.department}
                  disabled
                />
              </FormGroup>
            </Grid>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <>
            {/* Change Password */}
            <Card>
              <CardTitle>🔐 Changer le Mot de Passe</CardTitle>
              <form onSubmit={handlePasswordChange}>
                <FormGroup>
                  <Label>Mot de passe actuel</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value
                    })}
                    placeholder="Entrez votre mot de passe actuel"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPasswordForm({ ...passwordForm, newPassword: value });
                      updatePasswordRequirements(value);
                    }}
                    placeholder="Entrez un nouveau mot de passe"
                    required
                  />
                  <PasswordStrength>
                    <StrengthBar strength={getPasswordStrength()} />
                    <StrengthText>
                      Force: <strong>{getPasswordStrengthText()}</strong>
                    </StrengthText>
                    <RequirementsList>
                      <RequirementItem met={passwordRequirements.minLength}>
                        Au moins 8 caractères
                      </RequirementItem>
                      <RequirementItem met={passwordRequirements.hasUppercase}>
                        Une lettre majuscule
                      </RequirementItem>
                      <RequirementItem met={passwordRequirements.hasLowercase}>
                        Une lettre minuscule
                      </RequirementItem>
                      <RequirementItem met={passwordRequirements.hasNumber}>
                        Un chiffre
                      </RequirementItem>
                      <RequirementItem met={passwordRequirements.hasSpecial}>
                        Un caractère spécial (!@#$%^&*)
                      </RequirementItem>
                    </RequirementsList>
                  </PasswordStrength>
                </FormGroup>

                <FormGroup>
                  <Label>Confirmer le mot de passe</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirmez votre nouveau mot de passe"
                    required
                    className={
                      passwordForm.confirmPassword && 
                      passwordForm.newPassword !== passwordForm.confirmPassword 
                        ? 'error' 
                        : ''
                    }
                  />
                </FormGroup>

                <ButtonGroup>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || !Object.values(passwordRequirements).every(Boolean)}
                  >
                    {loading ? '⏳ CHANGEMENT EN COURS...' : '💾 CHANGER LE MOT DE PASSE'}
                  </Button>
                </ButtonGroup>
              </form>
            </Card>

            {/* Login History */}
            <Card>
              <CardTitle>📊 Historique de Connexion</CardTitle>
              {historyLoading ? (
                <EmptyState>
                  <div>⏳</div>
                  <div>Chargement...</div>
                </EmptyState>
              ) : loginHistory.length === 0 ? (
                <EmptyState>
                  <div>📭</div>
                  <div>Aucune connexion enregistrée</div>
                </EmptyState>
              ) : (
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <th>Date/Heure</th>
                        <th>Adresse IP</th>
                        <th>Navigateur</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((login, index) => (
                        <tr key={index}>
                          <td>{formatDate(login.login_at)}</td>
                          <td>{login.ip_address || 'N/A'}</td>
                          <td>{login.user_agent?.substring(0, 40) || 'N/A'}...</td>
                          <td>{login.method === 'session' ? '🔐 Session' : '🗝️ JWT'}</td>
                          <td>
                            <Badge status={login.success ? 'success' : 'danger'}>
                              {login.success ? '✓ Succès' : '✗ Échec'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card>
            <CardTitle>⚙️ Paramètres Avancés</CardTitle>
            <Grid columns={1}>
              <FormGroup>
                <Label>🔔 Notifications</Label>
                <Input
                  as="select"
                  value={preferences.notifications}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: e.target.value
                  })}
                  style={{ padding: '14px 18px', cursor: 'pointer' }}
                >
                  <option value="all">Toutes les notifications</option>
                  <option value="important">Importantes uniquement</option>
                  <option value="none">Aucune notification</option>
                </Input>
              </FormGroup>

              <FormGroup>
                <Label>⏱️ Déconnexion automatique</Label>
                <Input
                  as="select"
                  value={preferences.autoLogout}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    autoLogout: e.target.value
                  })}
                  style={{ padding: '14px 18px', cursor: 'pointer' }}
                >
                  <option value="15">15 minutes d'inactivité</option>
                  <option value="30">30 minutes d'inactivité</option>
                  <option value="60">1 heure d'inactivité</option>
                  <option value="0">Jamais</option>
                </Input>
              </FormGroup>
            </Grid>

            <ButtonGroup>
              <Button variant="primary">
                💾 SAUVEGARDER PARAMÈTRES
              </Button>
            </ButtonGroup>
          </Card>
        )}
      </Content>
    </Container>
  );
};

export default ProfilePage;
