import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaKey, FaEye, FaCopy, FaTrash, FaRedo, FaEyeSlash, FaLock, FaCheck, FaPlus, FaShieldAlt } from 'react-icons/fa';

// ============= STYLES =============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const CardWrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

// ============= FORM STYLES =============

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  
  .required {
    color: #e74c3c;
  }
`;

const Input = styled.input`
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    color: #999;
  }
`;

const TextArea = styled.textarea`
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background: #ecf0f1;
          color: #2c3e50;
          &:hover { background: #d5dbdb; }
        `;
      case 'danger':
        return `
          background: #e74c3c;
          color: white;
          &:hover { background: #c0392b; }
        `;
      case 'success':
        return `
          background: #27ae60;
          color: white;
          &:hover { background: #229954; }
        `;
      default:
        return `
          background: #3498db;
          color: white;
          &:hover { background: #2980b9; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border-radius: 4px;

  &:hover {
    background: rgba(52, 152, 219, 0.1);
    color: #2980b9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============= ALERT STYLES =============

const Alert = styled.div<{ type: 'success' | 'error' | 'warning' }>`
  padding: 1rem 1.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;

  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'error':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      case 'warning':
        return `
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffc107;
        `;
    }
  }}
`;

// ============= GENERATED PASSWORD STYLES =============

const GeneratedPasswordBox = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 1.5rem;
  color: white;
`;

const GeneratedPasswordHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const PasswordDisplayBox = styled.div`
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.1rem;
  font-weight: 500;
  word-break: break-all;
  margin-bottom: 1rem;
`;

const CopyButton = styled.button`
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #229954;
    transform: translateY(-2px);
  }
`;

const TimerBar = styled.div<{ percentage: number }>`
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.percentage}%;
    background: #fff;
    transition: width 0.1s linear;
  }
`;

// ============= PASSWORD LIST STYLES =============

const PasswordListSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PasswordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 700px;
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #bdc3c7;
    border-radius: 4px;

    &:hover {
      background: #95a5a6;
    }
  }
`;

const PasswordCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.3s;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  }
`;

const PasswordCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
`;

const PasswordTitle = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PasswordActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PasswordDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 2rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PasswordDetailRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PasswordDetailLabel = styled.span`
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PasswordDetailValue = styled.span`
  color: #2c3e50;
  word-break: break-all;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const PasswordSecretSection = styled.div<{ unlocked: boolean }>`
  background: ${props => props.unlocked ? '#d4edda' : '#fff3cd'};
  border: 1px solid ${props => props.unlocked ? '#c3e6cb' : '#ffc107'};
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
`;

const SecretPrompt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SecretInput = styled(Input)`
  margin: 0;
`;

const SecretButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const SecretButton = styled(Button)`
  flex: 1;
`;

const PasswordValueDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ecf0f1;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
  border: 2px dashed #bdc3c7;
  border-radius: 8px;

  svg {
    font-size: 3rem;
    color: #bdc3c7;
    margin-bottom: 1rem;
  }

  p {
    margin: 0;
    font-size: 1.05rem;
  }
`;

const SecurityNote = styled.div`
  background: #e8f4f8;
  border-left: 4px solid #3498db;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #2c3e50;
`;

// ============= TYPES =============

interface Password {
  id: number;
  application: string;
  username: string;
  length: number;
  secret_key?: string;
  created_at: string;
  notes?: string;
}

interface AlertMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

// ============= MAIN COMPONENT =============

const PasswordGeneratorPage: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    application: '',
    username: '',
    length: 16,
    secretKey: '',
    notes: ''
  });

  // Generation state
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const passwordCopiedRef = useRef(false);

  // List state
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout>();

  // Password viewing state
  const [unlockedPasswords, setUnlockedPasswords] = useState<Map<number, string>>(new Map());
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [viewingSecretInput, setViewingSecretInput] = useState<Map<number, string>>(new Map());

  // ============= EFFECTS =============

  useEffect(() => {
    fetchPasswords();
  }, []);

  useEffect(() => {
    if (timerRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimerRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          // Clear password when timer expires
          setGeneratedPassword(null);
          passwordCopiedRef.current = false;
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRemaining]);

  // ============= HANDLERS =============

  const showAlert = (type: AlertMessage['type'], message: string) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ type, message });
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 4000);
  };

  const fetchPasswords = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/passwords');
      const result = await response.json();
      if (result.success) {
        setPasswords(result.data);
      }
    } catch (error) {
      showAlert('error', 'Erreur lors du chargement des mots de passe');
    }
  };

  const handleGeneratePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/passwords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: formData.application,
          username: formData.username,
          length: formData.length,
          secretKey: formData.secretKey,
          notes: formData.notes || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedPassword(result.data.plainPassword);
        setTimerRemaining(10);
        passwordCopiedRef.current = false;
        showAlert('success', 'Mot de passe généré! Vous avez 10 secondes pour le copier.');
        setFormData({ application: '', username: '', length: 16, secretKey: '', notes: '' });
        fetchPasswords();
      } else {
        showAlert('error', result.message || 'Erreur lors de la génération');
      }
    } catch (error) {
      showAlert('error', 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (text: string) => {
    navigator.clipboard.writeText(text);
    passwordCopiedRef.current = true;
    showAlert('success', '✓ Copié dans le presse-papier!');
  };

  const handleUnlockPassword = async (password: Password) => {
    const secretInput = viewingSecretInput.get(password.id) || '';
    
    try {
      const response = await fetch(`http://localhost:5000/api/passwords/${password.id}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretInput })
      });

      const result = await response.json();

      if (result.success) {
        setUnlockedPasswords(prev => {
          const newMap = new Map(prev);
          newMap.set(password.id, result.data.plainPassword);
          return newMap;
        });
        setViewingSecretInput(prev => {
          const newMap = new Map(prev);
          newMap.delete(password.id);
          return newMap;
        });
        setVisiblePasswords(prev => new Set(prev).add(password.id));
        showAlert('success', 'Mot de passe déverrouillé');
      } else {
        showAlert('error', 'Clé secrète incorrecte');
      }
    } catch (error) {
      showAlert('error', 'Erreur lors du déverrouillage');
    }
  };

  const handleRegeneratePassword = async (id: number) => {
    if (!window.confirm('Régénérer ce mot de passe? L\'ancien sera perdu.')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/passwords/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', 'Mot de passe régénéré');
        setUnlockedPasswords(prev => {
          const newMap = new Map(prev);
          newMap.set(id, result.data.plainPassword);
          return newMap;
        });
        setVisiblePasswords(prev => new Set(prev).add(id));
        fetchPasswords();
      } else {
        showAlert('error', 'Erreur lors de la régénération');
      }
    } catch (error) {
      showAlert('error', 'Erreur de connexion');
    }
  };

  const handleDeletePassword = async (id: number) => {
    if (!window.confirm('Supprimer ce mot de passe? Cette action est irréversible.')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/passwords/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', 'Mot de passe supprimé');
        fetchPasswords();
      }
    } catch (error) {
      showAlert('error', 'Erreur lors de la suppression');
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ============= RENDER =============

  return (
    <Container>
      <Header>
        <h1>
          <FaShieldAlt /> Gestionnaire de Mots de Passe Sécurisés
        </h1>
      </Header>

      {alert && (
        <Alert type={alert.type}>
          {alert.type === 'success' && <FaCheck />}
          {alert.message}
        </Alert>
      )}

      <TwoColumn>
        {/* LEFT COLUMN - GENERATION */}
        <CardWrapper>
          <FormSection>
            <h2>Générer un Mot de Passe</h2>
            
            <SecurityNote>
              <FaLock /> Les mots de passe sont générés de manière déterministe basée sur votre clé secrète.
            </SecurityNote>
            
            <form onSubmit={handleGeneratePassword}>
              <FormGroup>
                <Label>
                  Application <span className="required">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="ex: Gmail, GitHub, AWS..."
                  value={formData.application}
                  onChange={(e) => setFormData({ ...formData, application: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  Nom d'utilisateur <span className="required">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="ex: john@example.com ou john.doe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  Longueur <span className="required">*</span>
                </Label>
                <Input
                  type="number"
                  min="8"
                  max="128"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <FaLock /> Clé Secrète <span className="required">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Clé pour reproduire le même mot de passe"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Notes (optionnel)</Label>
                <TextArea
                  placeholder="ex: Compte professionnel, à renouveler chaque mois..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </FormGroup>

              <ButtonGroup>
                <Button type="submit" disabled={loading} variant="primary">
                  <FaPlus /> {loading ? 'Génération...' : 'Générer'}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setFormData({ application: '', username: '', length: 16, secretKey: '', notes: '' })}
                >
                  Réinitialiser
                </Button>
              </ButtonGroup>
            </form>

            {/* Generated Password Display */}
            {generatedPassword && timerRemaining > 0 && (
              <GeneratedPasswordBox>
                <GeneratedPasswordHeader>
                  <h3>✨ Mot de passe généré</h3>
                </GeneratedPasswordHeader>

                <PasswordDisplayBox>
                  {generatedPassword}
                  <CopyButton onClick={() => handleCopyPassword(generatedPassword)}>
                    <FaCopy /> Copier
                  </CopyButton>
                </PasswordDisplayBox>

                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  {passwordCopiedRef.current 
                    ? '✓ Copié! Conservez-le en sécurité.'
                    : 'Dépêchez-vous de le copier avant expiration'
                  }
                </div>
                <TimerBar percentage={(timerRemaining / 10) * 100} />
              </GeneratedPasswordBox>
            )}
          </FormSection>
        </CardWrapper>

        {/* RIGHT COLUMN - PASSWORD LIST */}
        <CardWrapper>
          <PasswordListSection>
            <h2>Mots de Passe Enregistrés ({passwords.length})</h2>

            {passwords.length === 0 ? (
              <EmptyState>
                <FaKey />
                <p>Aucun mot de passe enregistré</p>
              </EmptyState>
            ) : (
              <PasswordList>
                {passwords.map(password => {
                  const isUnlocked = unlockedPasswords.has(password.id);
                  const isVisible = visiblePasswords.has(password.id);
                  const secretValue = viewingSecretInput.get(password.id) || '';

                  return (
                    <PasswordCard key={password.id}>
                      <PasswordCardHeader>
                        <PasswordTitle>
                          {password.secret_key && !isUnlocked && <FaLock size={14} />}
                          {password.application}
                        </PasswordTitle>
                        <PasswordActions>
                          <IconButton
                            onClick={() => handleRegeneratePassword(password.id)}
                            title="Régénérer"
                          >
                            <FaRedo />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeletePassword(password.id)}
                            title="Supprimer"
                            style={{ color: '#e74c3c' }}
                          >
                            <FaTrash />
                          </IconButton>
                        </PasswordActions>
                      </PasswordCardHeader>

                      {!isUnlocked && (
                        <Button 
                          onClick={() => handleUnlockPassword(password)}
                          variant="primary"
                          style={{ width: '100%', marginBottom: '1rem' }}
                        >
                          <FaEye /> Afficher le mot de passe
                        </Button>
                      )}

                      {isUnlocked && (
                        <Button 
                          variant="success"
                          disabled
                          style={{ width: '100%', marginBottom: '1rem' }}
                        >
                          <FaCheck /> Mot de passe déverrouillé
                        </Button>
                      )}

                      <PasswordDetails>
                        <PasswordDetailRow>
                          <PasswordDetailLabel>Utilisateur</PasswordDetailLabel>
                          <PasswordDetailValue>{password.username}</PasswordDetailValue>
                        </PasswordDetailRow>
                        <PasswordDetailRow>
                          <PasswordDetailLabel>Longueur</PasswordDetailLabel>
                          <PasswordDetailValue>{password.length} caractères</PasswordDetailValue>
                        </PasswordDetailRow>
                        <PasswordDetailRow>
                          <PasswordDetailLabel>Créé</PasswordDetailLabel>
                          <PasswordDetailValue>
                            {new Date(password.created_at).toLocaleDateString('fr-FR')}
                          </PasswordDetailValue>
                        </PasswordDetailRow>
                        {password.notes && (
                          <PasswordDetailRow>
                            <PasswordDetailLabel>Notes</PasswordDetailLabel>
                            <PasswordDetailValue>{password.notes}</PasswordDetailValue>
                          </PasswordDetailRow>
                        )}
                      </PasswordDetails>

                      {/* Secret Key Management */}
                      {!isUnlocked && (
                        <PasswordSecretSection unlocked={false}>
                          <SecretPrompt>
                            <PasswordDetailLabel>🔐 Clé secrète requise</PasswordDetailLabel>
                            <SecretInput
                              type="password"
                              placeholder="Entrez la clé secrète"
                              value={secretValue}
                              onChange={(e) => setViewingSecretInput(prev => {
                                const newMap = new Map(prev);
                                newMap.set(password.id, e.target.value);
                                return newMap;
                              })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && secretValue) {
                                  handleUnlockPassword(password);
                                }
                              }}
                            />
                            <SecretButtonGroup>
                              <SecretButton
                                onClick={() => handleUnlockPassword(password)}
                                disabled={!secretValue}
                                variant="primary"
                              >
                                Déverrouiller
                              </SecretButton>
                            </SecretButtonGroup>
                          </SecretPrompt>
                        </PasswordSecretSection>
                      )}

                      {isUnlocked && (
                        <PasswordSecretSection unlocked={true}>
                          <div>
                            <PasswordDetailLabel style={{ display: 'block', marginBottom: '0.75rem' }}>
                              Mot de passe
                            </PasswordDetailLabel>
                            <PasswordValueDisplay>
                              {isVisible
                                ? unlockedPasswords.get(password.id)
                                : '••••••••••••••••'
                              }
                              <IconButton
                                onClick={() => togglePasswordVisibility(password.id)}
                                title={isVisible ? 'Masquer' : 'Afficher'}
                              >
                                {isVisible ? <FaEyeSlash /> : <FaEye />}
                              </IconButton>
                              <IconButton
                                onClick={() => handleCopyPassword(unlockedPasswords.get(password.id)!)}
                                title="Copier"
                              >
                                <FaCopy />
                              </IconButton>
                            </PasswordValueDisplay>
                          </div>
                        </PasswordSecretSection>
                      )}
                    </PasswordCard>
                  );
                })}
              </PasswordList>
            )}
          </PasswordListSection>
        </CardWrapper>
      </TwoColumn>
    </Container>
  );
};

export default PasswordGeneratorPage;
