import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader, Smartphone } from 'lucide-react';
import apiClient from '../services/api';
import { colors } from '../config/colors';

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  min-height: 100vh;
  background: ${colors.background.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const CardContainer = styled.div`
  background: ${colors.background.primary};
  border-radius: 12px;
  box-shadow: 0 4px 6px ${colors.shadow.md};
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  border: 1px solid ${colors.border.light};
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${colors.primary.blue};
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 2rem;
  transition: color 0.2s;

  &:hover {
    color: ${colors.primary.blueLight};
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${colors.text.primary};
  margin: 0;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${colors.text.secondary};
  font-size: 1rem;
  margin: 0;
`;

const MethodTabs = styled.div`
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
`;

const MethodTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 1rem;
  border: 2px solid ${props => props.$active ? colors.primary.blue : colors.border.light};
  background: ${props => props.$active ? `${colors.primary.blue}20` : colors.background.primary};
  color: ${props => props.$active ? colors.primary.blue : colors.text.secondary};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    border-color: ${colors.primary.blue};
  }
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
  font-weight: 600;
  color: ${colors.text.primary};
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid ${colors.border.light};
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: ${colors.background.primary};
  color: ${colors.text.primary};

  &:focus {
    outline: none;
    border-color: ${colors.primary.blue};
    box-shadow: 0 0 0 3px ${colors.alert.infoBg};
  }

  &:disabled {
    background: ${colors.background.secondary};
    cursor: not-allowed;
    color: ${colors.text.tertiary};
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background: ${colors.primary.blue};
  color: ${colors.text.white};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: ${colors.primary.blueLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ type: 'error' | 'success' | 'info' }>`
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
  background: ${props => {
    switch (props.type) {
      case 'error':
        return colors.alert.dangerBg;
      case 'success':
        return colors.alert.successBg;
      case 'info':
        return colors.alert.infoBg;
      default:
        return colors.background.secondary;
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'error':
        return colors.alert.dangerText;
      case 'success':
        return colors.alert.successText;
      case 'info':
        return colors.alert.infoText;
      default:
        return colors.text.primary;
    }
  }};
`;

const MessageText = styled.div`
  flex: 1;
  line-height: 1.5;
`;

const SuccessContainer = styled.div`
  text-align: center;
`;

const SuccessIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const SuccessTitle = styled.h2`
  color: ${colors.text.primary};
  margin-bottom: 0.5rem;
`;

const SuccessMessage = styled.p`
  color: ${colors.text.secondary};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const StepsContainer = styled.div`
  background: ${colors.background.secondary};
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: left;
`;

const StepItem = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StepNumber = styled.div`
  background: ${colors.primary.blue};
  color: ${colors.text.white};
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
`;

const StepText = styled.div`
  color: ${colors.text.primary};
  padding-top: 0.25rem;
`;

const FooterText = styled.p`
  text-align: center;
  color: ${colors.text.secondary};
  font-size: 0.9rem;
  margin-top: 1.5rem;
`;

const LoginLink = styled(Link)`
  color: ${colors.primary.blue};
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

// ============= COMPONENT =============

const ForgotPasswordPage: React.FC = () => {
  const [method, setMethod] = useState<'email' | 'otp'>('email');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const endpoint = method === 'email' ? '/auth/forgot-password' : '/auth/forgot-password-otp';
      const payload = method === 'email' ? { email: input } : { username: input };
      
      const response = await apiClient.post<{ success: boolean; message: string }>(
        endpoint,
        payload
      );

      if (response?.success) {
        setSuccessMessage(response.message || 'Demande envoyée');
        
        // Pour OTP, rediriger vers la page de vérification
        if (method === 'otp') {
          setTimeout(() => {
            navigate('/otp-verification?username=' + encodeURIComponent(input));
          }, 1500);
        } else {
          // Pour email, afficher le succès
          setSubmitted(true);
        }
        setInput('');
      } else {
        setError(response?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Container>
        <CardContainer>
          <BackButton to="/login">
            <ArrowLeft size={18} />
            Retour à la connexion
          </BackButton>

          <SuccessContainer>
            <SuccessIcon>✉️</SuccessIcon>
            <SuccessTitle>Demande reçue</SuccessTitle>
            <SuccessMessage>
              {method === 'email' 
                ? 'Un lien de réinitialisation de mot de passe a été envoyé à votre adresse email.'
                : 'Nous avons vérifié votre compte. Entrez votre code OTP 2FA pour changer votre mot de passe.'}
            </SuccessMessage>

            <StepsContainer>
              {method === 'email' ? (
                <>
                  <StepItem>
                    <StepNumber>1</StepNumber>
                    <StepText>Consultez votre boîte de réception</StepText>
                  </StepItem>
                  <StepItem>
                    <StepNumber>2</StepNumber>
                    <StepText>Cliquez sur le lien fourni dans l'email</StepText>
                  </StepItem>
                  <StepItem>
                    <StepNumber>3</StepNumber>
                    <StepText>Créez un nouveau mot de passe sécurisé</StepText>
                  </StepItem>
                  <StepItem>
                    <StepNumber>4</StepNumber>
                    <StepText>Connectez-vous avec votre nouveau mot de passe</StepText>
                  </StepItem>
                </>
              ) : (
                <>
                  <StepItem>
                    <StepNumber>1</StepNumber>
                    <StepText>Préparez votre code OTP 2FA</StepText>
                  </StepItem>
                  <StepItem>
                    <StepNumber>2</StepNumber>
                    <StepText>Entrez le code OTP pour vérification</StepText>
                  </StepItem>
                  <StepItem>
                    <StepNumber>3</StepNumber>
                    <StepText>Créez un nouveau mot de passe sécurisé</StepText>
                  </StepItem>
                  <StepItem>
                    <StepNumber>4</StepNumber>
                    <StepText>Connectez-vous avec votre nouveau mot de passe</StepText>
                  </StepItem>
                </>
              )}
            </StepsContainer>

            <Message type="info">
              <AlertCircle size={20} />
              <MessageText>
                {method === 'email' 
                  ? 'Le lien d\'activation expire dans 1 heure.'
                  : 'Votre code 2FA standard s\'applique.'}
              </MessageText>
            </Message>

            <FooterText>
              Vous avez un compte? <LoginLink to="/login">Se connecter</LoginLink>
            </FooterText>
          </SuccessContainer>
        </CardContainer>
      </Container>
    );
  }

  return (
    <Container>
      <CardContainer>
        <BackButton to="/login">
          <ArrowLeft size={18} />
          Retour à la connexion
        </BackButton>

        <Header>
          <Title>🔐 Réinitialiser le mot de passe</Title>
          <Subtitle>Sélectionnez la méthode pour réinitialiser votre mot de passe</Subtitle>
        </Header>

        <MethodTabs>
          <MethodTab 
            $active={method === 'email'} 
            onClick={() => setMethod('email')}
            type="button"
          >
            <Mail size={18} />
            Email
          </MethodTab>
          <MethodTab 
            $active={method === 'otp'} 
            onClick={() => setMethod('otp')}
            type="button"
          >
            <Smartphone size={18} />
            Code OTP
          </MethodTab>
        </MethodTabs>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="input">
              {method === 'email' ? 'Adresse email' : 'Nom d\'utilisateur'}
            </Label>
            <Input
              id="input"
              type={method === 'email' ? 'email' : 'text'}
              placeholder={method === 'email' ? 'vous@example.com' : 'nomutilisateur'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              required
            />
            {method === 'otp' && (
              <p style={{ fontSize: '0.85rem', color: colors.text.secondary, margin: '0.5rem 0 0 0' }}>
                Entrez votre nom d'utilisateur pour vérifier et réinitialiser votre mot de passe
              </p>
            )}
          </FormGroup>

          <Button type="submit" disabled={loading || !input}>
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Envoi en cours...
              </>
            ) : method === 'email' ? (
              <>
                <Mail size={18} />
                Envoyer le lien
              </>
            ) : (
              <>
                <Smartphone size={18} />
                Vérifier et réinitialiser
              </>
            )}
          </Button>
        </Form>

        {error && (
          <Message type="error">
            <AlertCircle size={20} />
            <MessageText>{error}</MessageText>
          </Message>
        )}

        {successMessage && (
          <Message type="success">
            <CheckCircle size={20} />
            <MessageText>{successMessage}</MessageText>
          </Message>
        )}

        {method === 'email' && (
          <Message type="info">
            <Mail size={20} />
            <MessageText>
              Vérifiez votre boîte de réception et votre dossier des spams.
            </MessageText>
          </Message>
        )}

        <FooterText>
          Vous avez un compte? <LoginLink to="/login">Se connecter</LoginLink>
        </FooterText>
      </CardContainer>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Container>
  );
};

export default ForgotPasswordPage;
