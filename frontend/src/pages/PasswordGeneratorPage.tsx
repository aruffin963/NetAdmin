import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaKey, FaCopy, FaTrash, FaRedo, FaEye, FaEyeSlash } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
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
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: #e74c3c;
          color: white;
          &:hover:not(:disabled) {
            background: #c0392b;
          }
        `;
      case 'secondary':
        return `
          background: #95a5a6;
          color: white;
          &:hover:not(:disabled) {
            background: #7f8c8d;
          }
        `;
      default:
        return `
          background: #3498db;
          color: white;
          &:hover:not(:disabled) {
            background: #2980b9;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GeneratedPasswordBox = styled.div`
  background: #f8f9fa;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const PasswordDisplay = styled.div`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  word-break: break-all;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #3498db;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #2980b9;
    transform: scale(1.1);
  }
`;

const PasswordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
`;

const PasswordItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s;

  &:hover {
    border-color: #3498db;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
  }
`;

const PasswordItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PasswordItemTitle = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
`;

const PasswordItemActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PasswordItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
`;

const PasswordItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PasswordItemLabel = styled.span`
  font-weight: 500;
  min-width: 80px;
`;

const PasswordValue = styled.div`
  flex: 1;
  font-family: 'Courier New', monospace;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #95a5a6;
`;

const Alert = styled.div<{ type?: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  ${props => props.type === 'success' 
    ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
    : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
  }
`;

interface Password {
  id: number;
  application: string;
  username: string;
  length: number;
  secret_key?: string;
  created_at: string;
  notes?: string;
}

const PasswordGeneratorPage: React.FC = () => {
  const [formData, setFormData] = useState({
    application: '',
    username: '',
    length: 16,
    secretKey: '',
    notes: ''
  });
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [revealedPasswords, setRevealedPasswords] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/passwords');
      const result = await response.json();
      if (result.success) {
        setPasswords(result.data);
      }
    } catch (error) {
      console.error('Error fetching passwords:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch('http://localhost:5000/api/passwords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: formData.application,
          username: formData.username,
          length: formData.length,
          secretKey: formData.secretKey || undefined,
          notes: formData.notes || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedPassword(result.data.plainPassword);
        setAlert({ type: 'success', message: 'Mot de passe généré avec succès!' });
        fetchPasswords();
      } else {
        setAlert({ type: 'error', message: result.message || 'Erreur lors de la génération' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setAlert({ type: 'success', message: 'Copié dans le presse-papier!' });
    setTimeout(() => setAlert(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce mot de passe?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/passwords/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setAlert({ type: 'success', message: 'Mot de passe supprimé' });
        fetchPasswords();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  const handleRegenerate = async (id: number) => {
    if (!window.confirm('Régénérer le mot de passe? L\'ancien sera perdu.')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/passwords/${id}/regenerate`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        setAlert({ type: 'success', message: 'Mot de passe régénéré!' });
        setRevealedPasswords(prev => {
          const newMap = new Map(prev);
          newMap.set(id, result.data.plainPassword);
          return newMap;
        });
        setVisiblePasswords(prev => new Set(prev).add(id));
        fetchPasswords();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la régénération' });
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

  return (
    <Container>
      <Header>
        <Title>
          <FaKey /> Générateur de Mots de Passe
        </Title>
        <Subtitle>Créez et gérez des mots de passe sécurisés pour vos applications</Subtitle>
      </Header>

      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      <Content>
        <Card>
          <CardTitle>Générer un nouveau mot de passe</CardTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Application *</Label>
              <Input
                type="text"
                value={formData.application}
                onChange={e => setFormData({ ...formData, application: e.target.value })}
                placeholder="Ex: Base de données production"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Nom d'utilisateur *</Label>
              <Input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="Ex: admin"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Longueur (8-128 caractères)</Label>
              <Input
                type="number"
                min="8"
                max="128"
                value={formData.length}
                onChange={e => setFormData({ ...formData, length: parseInt(e.target.value) })}
              />
            </FormGroup>

            <FormGroup>
              <Label>Clé secrète (optionnel)</Label>
              <Input
                type="text"
                value={formData.secretKey}
                onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                placeholder="Pour générer toujours le même mot de passe"
              />
            </FormGroup>

            <FormGroup>
              <Label>Notes (optionnel)</Label>
              <Input
                type="text"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations supplémentaires"
              />
            </FormGroup>

            <Button type="submit" disabled={loading}>
              <FaKey /> {loading ? 'Génération...' : 'Générer le mot de passe'}
            </Button>
          </Form>

          {generatedPassword && (
            <GeneratedPasswordBox>
              <PasswordDisplay>{generatedPassword}</PasswordDisplay>
              <IconButton onClick={() => handleCopy(generatedPassword)} title="Copier">
                <FaCopy size={20} />
              </IconButton>
            </GeneratedPasswordBox>
          )}
        </Card>

        <Card>
          <CardTitle>Mots de passe enregistrés ({passwords.length})</CardTitle>
          <PasswordList>
            {passwords.length === 0 ? (
              <EmptyState>
                <FaKey size={48} />
                <p>Aucun mot de passe enregistré</p>
              </EmptyState>
            ) : (
              passwords.map(password => (
                <PasswordItem key={password.id}>
                  <PasswordItemHeader>
                    <PasswordItemTitle>{password.application}</PasswordItemTitle>
                    <PasswordItemActions>
                      <IconButton onClick={() => handleRegenerate(password.id)} title="Régénérer">
                        <FaRedo size={16} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(password.id)} title="Supprimer">
                        <FaTrash size={16} color="#e74c3c" />
                      </IconButton>
                    </PasswordItemActions>
                  </PasswordItemHeader>
                  <PasswordItemDetails>
                    <PasswordItemRow>
                      <PasswordItemLabel>Username:</PasswordItemLabel>
                      <span>{password.username}</span>
                    </PasswordItemRow>
                    <PasswordItemRow>
                      <PasswordItemLabel>Longueur:</PasswordItemLabel>
                      <span>{password.length} caractères</span>
                    </PasswordItemRow>
                    {revealedPasswords.has(password.id) && (
                      <PasswordItemRow>
                        <PasswordItemLabel>Mot de passe:</PasswordItemLabel>
                        <PasswordValue>
                          {visiblePasswords.has(password.id) 
                            ? revealedPasswords.get(password.id)
                            : '••••••••••••••••'
                          }
                          <IconButton onClick={() => togglePasswordVisibility(password.id)}>
                            {visiblePasswords.has(password.id) ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                          </IconButton>
                          <IconButton onClick={() => handleCopy(revealedPasswords.get(password.id)!)}>
                            <FaCopy size={14} />
                          </IconButton>
                        </PasswordValue>
                      </PasswordItemRow>
                    )}
                    <PasswordItemRow>
                      <PasswordItemLabel>Créé le:</PasswordItemLabel>
                      <span>{new Date(password.created_at).toLocaleString('fr-FR')}</span>
                    </PasswordItemRow>
                    {password.notes && (
                      <PasswordItemRow>
                        <PasswordItemLabel>Notes:</PasswordItemLabel>
                        <span>{password.notes}</span>
                      </PasswordItemRow>
                    )}
                  </PasswordItemDetails>
                </PasswordItem>
              ))
            )}
          </PasswordList>
        </Card>
      </Content>
    </Container>
  );
};

export default PasswordGeneratorPage;
