import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';

const ProfilePageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
`;

const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
    }
  ` : `
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    
    &:hover {
      background: #f8fafc;
      color: #1e293b;
    }
  `}
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #374151;
`;

const InfoValue = styled.span`
  color: #64748b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const Badge = styled.span<{ status: 'online' | 'offline' | 'away' }>`
  padding: 4px 12px;
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
      case 'away':
        return `
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fed7aa;
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

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin: 0 auto 20px auto;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
`;

const Notification = styled.div<{ show: boolean; type: 'success' | 'info' | 'warning' }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  z-index: 1000;
  transform: ${props => props.show ? 'translateY(0)' : 'translateY(-100px)'};
  opacity: ${props => props.show ? 1 : 0};
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return 'background: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);';
      case 'info': 
        return 'background: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);';
      case 'warning':
        return 'background: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);';
      default:
        return 'background: #64748b;';
    }
  }}
`;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth(); // Récupérer les données LDAP
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'info' | 'warning'
  });
  
  // Fonction pour obtenir les informations réelles du navigateur
  const getRealBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let version = 'Unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browserName = 'Chrome';
      const match = ua.match(/Chrome\/([0-9.]+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox';
      const match = ua.match(/Firefox\/([0-9.]+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.includes('Edg')) {
      browserName = 'Edge';
      const match = ua.match(/Edg\/([0-9.]+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browserName = 'Safari';
      const match = ua.match(/Version\/([0-9.]+)/);
      version = match ? match[1] : 'Unknown';
    }

    return `${browserName} ${version}`;
  };

  // Fonction pour obtenir les informations du système
  const getSystemInfo = () => {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';
    
    return {
      os,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  // Fonction pour obtenir l'adresse IP (simulation car nécessite API)
  const getRealIPAddress = async () => {
    try {
      // Utilisation de l'API ipify pour obtenir la vraie adresse IP publique
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Impossible de récupérer l\'adresse IP publique:', error);
      // Fallback vers une IP locale statique si l'API échoue
      return '192.168.1.100';
    }
  };

  // Fonction pour générer un session ID réaliste
  const generateSessionId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `sess_${timestamp}_${random}`;
  };

  // Fonction pour détecter le statut en ligne
  const getConnectionStatus = (): 'online' | 'offline' | 'away' => {
    if (!navigator.onLine) return 'offline';
    
    // Logique simple pour détecter si l'utilisateur est "absent"
    // En production, cela pourrait être basé sur l'activité récente
    const lastActivity = Date.now() - (document.hasFocus() ? 0 : 5 * 60 * 1000);
    if (lastActivity > 10 * 60 * 1000) return 'away'; // 10 minutes d'inactivité
    
    return 'online';
  };

  const [sessionInfo, setSessionInfo] = useState({
    status: getConnectionStatus(),
    lastConnection: new Date(),
    ipAddress: 'Chargement...',
    browser: getRealBrowserInfo(),
    sessionId: generateSessionId(),
    systemInfo: getSystemInfo(),
    sessionDuration: 0 // en minutes
  });

  // Effet pour charger les informations réelles au montage
  useEffect(() => {
    const sessionStartTime = Date.now();
    
    const loadRealSessionInfo = async () => {
      const realIP = await getRealIPAddress();
      setSessionInfo(prev => ({
        ...prev,
        ipAddress: realIP,
        status: getConnectionStatus(),
        systemInfo: getSystemInfo()
      }));
    };

    loadRealSessionInfo();

    // Écouter les changements de connexion
    const handleOnline = () => setSessionInfo(prev => ({ ...prev, status: 'online' }));
    const handleOffline = () => setSessionInfo(prev => ({ ...prev, status: 'offline' }));
    const handleVisibilityChange = () => {
      setSessionInfo(prev => ({ ...prev, status: getConnectionStatus() }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Mise à jour périodique du statut et de la durée de session
    const statusInterval = setInterval(() => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000); // en minutes
      setSessionInfo(prev => ({ 
        ...prev, 
        status: getConnectionStatus(),
        sessionDuration
      }));
    }, 30000); // Vérifie toutes les 30 secondes

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(statusInterval);
    };
  }, []);

  const [profile, setProfile] = useState({
    username: user?.username || 'N/A',
    email: user?.email || 'N/A',
    role: 'Administrateur Réseau',
    department: 'IT Infrastructure',
    location: 'Paris, France',
    timezone: 'Europe/Paris',
    language: 'fr-FR'
  });

  // Mettre à jour le profil quand les données LDAP changent
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        username: user.username || prev.username,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const [preferences, setPreferences] = useState({
    notifications: 'all',
    autoRefresh: '30',
    dateFormat: 'DD/MM/YYYY'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Ici on sauvegarderait les données
    console.log('Profil sauvegardé:', profile);
    showNotification('Profil sauvegardé avec succès !', 'success');
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Ici on restaurerait les données originales
    showNotification('Modifications annulées', 'info');
  };

  const handlePreferencesSave = () => {
    // Ici on sauvegarderait les préférences
    console.log('Préférences sauvegardées:', preferences);
    showNotification('Préférences sauvegardées avec succès !', 'success');
  };

  const handlePreferencesReset = () => {
    setPreferences({
      notifications: 'all',
      autoRefresh: '30',
      dateFormat: 'DD/MM/YYYY'
    });
    showNotification('Préférences réinitialisées', 'info');
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleRefreshSession = async () => {
    // Actualiser avec de vraies informations
    const realIP = await getRealIPAddress();
    setSessionInfo(prev => ({
      ...prev,
      lastConnection: new Date(),
      sessionId: generateSessionId(),
      ipAddress: realIP,
      browser: getRealBrowserInfo(),
      status: getConnectionStatus(),
      systemInfo: getSystemInfo()
    }));
    showNotification('Session actualisée avec succès !', 'success');
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      // Ici on redirigerait vers la page de connexion
      showNotification('Déconnexion en cours...', 'info');
      // window.location.href = '/login';
    }
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    // Appliquer immédiatement certaines préférences
    switch (key) {
      case 'dateFormat':
        showNotification(`Format de date changé vers ${value}`, 'info');
        break;
      case 'notifications':
        showNotification(`Préférences de notification mises à jour`, 'info');
        break;
      case 'autoRefresh':
        const refreshLabels = { '5': '5 secondes', '10': '10 secondes', '30': '30 secondes', '60': '1 minute', '300': '5 minutes', '0': 'désactivé' };
        showNotification(`Rafraîchissement automatique: ${refreshLabels[value as keyof typeof refreshLabels]}`, 'info');
        break;
      default:
        break;
    }
  };

  const formatDate = (date: Date) => {
    switch (preferences.dateFormat) {
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      case 'DD.MM.YYYY':
        return date.toLocaleDateString('de-DE');
      default:
        return date.toLocaleDateString('fr-FR');
    }
  };

  const getInitials = () => {
    return profile.username.substring(0, 2).toUpperCase();
  };

  return (
    <ProfilePageContainer>
      <Notification 
        show={notification.show} 
        type={notification.type}
      >
        {notification.message}
      </Notification>
      
      <Header>
        <Title>
          👤 Profil Utilisateur
        </Title>
      </Header>

      <ContentGrid>
        {/* Informations Personnelles */}
        <Card>
          <CardTitle>👤 Informations Personnelles</CardTitle>
          
          <Avatar>{getInitials()}</Avatar>
          
          <FormGroup>
            <Label>Nom d'utilisateur</Label>
            <Input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({...profile, username: e.target.value})}
              disabled={!isEditing}
            />
          </FormGroup>

          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              disabled={!isEditing}
            />
          </FormGroup>

          <ButtonGroup>
            {!isEditing ? (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                ✏️ Modifier
              </Button>
            ) : (
              <>
                <Button variant="primary" onClick={handleSave}>
                  💾 Sauvegarder
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  ❌ Annuler
                </Button>
              </>
            )}
          </ButtonGroup>
        </Card>

        {/* Informations Professionnelles */}
        <Card>
          <CardTitle>🏢 Informations Professionnelles</CardTitle>

          <FormGroup>
            <Label>Rôle</Label>
            <Input
              type="text"
              value={profile.role}
              onChange={(e) => setProfile({...profile, role: e.target.value})}
              disabled={!isEditing}
            />
          </FormGroup>

          <FormGroup>
            <Label>Département</Label>
            <Input
              type="text"
              value={profile.department}
              onChange={(e) => setProfile({...profile, department: e.target.value})}
              disabled={!isEditing}
            />
          </FormGroup>

          <FormGroup>
            <Label>Localisation</Label>
            <Input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({...profile, location: e.target.value})}
              disabled={!isEditing}
            />
          </FormGroup>

          <FormGroup>
            <Label>Fuseau Horaire</Label>
            <Select
              value={profile.timezone}
              onChange={(e) => setProfile({...profile, timezone: e.target.value})}
              disabled={!isEditing}
            >
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Langue</Label>
            <Select
              value={profile.language}
              onChange={(e) => setProfile({...profile, language: e.target.value})}
              disabled={!isEditing}
            >
              <option value="fr-FR">Français</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
              <option value="de-DE">Deutsch</option>
            </Select>
          </FormGroup>
        </Card>

        {/* Statut de Session */}
        <Card>
          <CardTitle>🔒 Statut de Session</CardTitle>

          <InfoItem>
            <InfoLabel>Statut</InfoLabel>
            <Badge status={sessionInfo.status}>
              {sessionInfo.status === 'online' ? 'En ligne' : 
               sessionInfo.status === 'offline' ? 'Hors ligne' : 'Absent'}
            </Badge>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Dernière connexion</InfoLabel>
            <InfoValue>{formatDate(sessionInfo.lastConnection)} {sessionInfo.lastConnection.toLocaleTimeString('fr-FR')}</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Durée de session</InfoLabel>
            <InfoValue>
              {sessionInfo.sessionDuration === 0 ? 'Moins d\'1 minute' : 
               sessionInfo.sessionDuration === 1 ? '1 minute' : 
               `${sessionInfo.sessionDuration} minutes`}
            </InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Adresse IP</InfoLabel>
            <InfoValue>{sessionInfo.ipAddress}</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Navigateur</InfoLabel>
            <InfoValue>{sessionInfo.browser}</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Système d'exploitation</InfoLabel>
            <InfoValue>{sessionInfo.systemInfo.os} ({sessionInfo.systemInfo.platform})</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Résolution écran</InfoLabel>
            <InfoValue>{sessionInfo.systemInfo.screenResolution} • {sessionInfo.systemInfo.colorDepth} bits</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Fuseau horaire</InfoLabel>
            <InfoValue>{sessionInfo.systemInfo.timezone}</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Langue navigateur</InfoLabel>
            <InfoValue>{sessionInfo.systemInfo.language}</InfoValue>
          </InfoItem>

          <InfoItem>
            <InfoLabel>Session ID</InfoLabel>
            <InfoValue>{sessionInfo.sessionId}</InfoValue>
          </InfoItem>

          <ButtonGroup>
            <Button variant="secondary" onClick={handleRefreshSession}>
              🔄 Actualiser Session
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              🚪 Déconnexion
            </Button>
          </ButtonGroup>
        </Card>

        {/* Préférences */}
        <Card>
          <CardTitle>⚙️ Préférences</CardTitle>

          <FormGroup>
            <Label>🔔 Notifications</Label>
            <Select 
              value={preferences.notifications} 
              onChange={(e) => handlePreferenceChange('notifications', e.target.value)}
            >
              <option value="all">🔔 Toutes les notifications</option>
              <option value="important">⚠️ Importantes uniquement</option>
              <option value="none">🔕 Aucune notification</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>🔄 Rafraîchissement automatique</Label>
            <Select 
              value={preferences.autoRefresh} 
              onChange={(e) => handlePreferenceChange('autoRefresh', e.target.value)}
            >
              <option value="5">⚡ 5 secondes</option>
              <option value="10">🚀 10 secondes</option>
              <option value="30">⏱️ 30 secondes</option>
              <option value="60">🕐 1 minute</option>
              <option value="300">⏳ 5 minutes</option>
              <option value="0">🛑 Désactivé</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>📅 Format de date</Label>
            <Select 
              value={preferences.dateFormat} 
              onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
            >
              <option value="DD/MM/YYYY">🇫🇷 DD/MM/YYYY (Français)</option>
              <option value="MM/DD/YYYY">🇺🇸 MM/DD/YYYY (Américain)</option>
              <option value="YYYY-MM-DD">🌍 YYYY-MM-DD (ISO)</option>
              <option value="DD.MM.YYYY">🇩🇪 DD.MM.YYYY (Allemand)</option>
            </Select>
          </FormGroup>

          <ButtonGroup>
            <Button variant="primary" onClick={handlePreferencesSave}>
              💾 Sauvegarder Préférences
            </Button>
            <Button variant="secondary" onClick={handlePreferencesReset}>
              🔄 Réinitialiser
            </Button>
          </ButtonGroup>
        </Card>
      </ContentGrid>
    </ProfilePageContainer>
  );
};

export default ProfilePage;