import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAutoSave } from '../hooks/useAutoSave';
import { FaSave, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const InfoBanner = styled.div`
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #1976d2;
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
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
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

  &:hover:not(:disabled) {
    background: #2980b9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveStatus = styled.div<{ visible: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #27ae60;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s;
`;

const AutoSaveDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [dataRestored, setDataRestored] = useState(false);

  const { loadSavedData, clearSavedData, forceSave } = useAutoSave({
    pagePath: '/demo-autosave',
    formData,
    enabled: true,
    debounceMs: 2000, // Save 2 seconds after user stops typing
  });

  // Load saved data on mount
  useEffect(() => {
    loadSavedData().then(savedData => {
      if (savedData) {
        setFormData(savedData);
        setDataRestored(true);
      }
    });
  }, [loadSavedData]);

  // Show save indicator whenever form data changes
  useEffect(() => {
    if (!dataRestored && (formData.name || formData.email || formData.phone || formData.message)) {
      setShowSaveStatus(true);
      const timer = setTimeout(() => setShowSaveStatus(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [formData, dataRestored]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setDataRestored(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Force save before submit
    forceSave();
    
    alert('Formulaire soumis!\n\n' + JSON.stringify(formData, null, 2));
    
    // Clear auto-saved data after successful submit
    await clearSavedData();
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  const handleClear = async () => {
    await clearSavedData();
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  return (
    <Container>
      <Header>
        <Title>Démonstration Auto-Save</Title>
        <Subtitle>Vos données sont sauvegardées automatiquement toutes les 2 secondes</Subtitle>
      </Header>

      {dataRestored && (
        <InfoBanner>
          <FaInfoCircle size={24} />
          <div>
            <strong>Données restaurées!</strong> Vos données de formulaire ont été automatiquement 
            restaurées depuis votre dernière session.
          </div>
        </InfoBanner>
      )}

      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Jean Dupont"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jean.dupont@example.com"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+33 1 23 45 67 89"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="message">Message</Label>
            <TextArea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Votre message..."
            />
          </FormGroup>

          <SaveStatus visible={showSaveStatus}>
            <FaSave />
            Sauvegarde automatique en cours...
          </SaveStatus>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button type="submit">
              <FaCheckCircle />
              Soumettre le formulaire
            </Button>
            <Button type="button" onClick={handleClear} style={{ background: '#95a5a6' }}>
              Effacer tout
            </Button>
          </div>
        </Form>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Comment ça marche?</h3>
        <ul style={{ color: '#7f8c8d', lineHeight: '1.8' }}>
          <li>Tapez dans les champs ci-dessus</li>
          <li>Vos données sont automatiquement sauvegardées après 2 secondes d'inactivité</li>
          <li>Fermez l'onglet ou rechargez la page</li>
          <li>Revenez sur cette page - vos données seront restaurées!</li>
          <li>Après 15 minutes d'inactivité, vous devrez vous reconnecter</li>
          <li>Vos données seront toujours là après la reconnexion</li>
        </ul>
      </Card>
    </Container>
  );
};

export default AutoSaveDemo;
