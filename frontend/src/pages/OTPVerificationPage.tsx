import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
  margin-bottom: 2rem;
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

const OTPInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
`;

const OTPInput = styled.input`
  width: 50px;
  height: 50px;
  padding: 0;
  font-size: 1.5rem;
  text-align: center;
  font-weight: bold;
  border: 2px solid ${colors.border.light};
  border-radius: 8px;
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

type Step = 'otp-verify' | 'password-reset' | 'success';

const OTPVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const usernameFromUrl = searchParams.get('username') || '';

  const [username] = useState(usernameFromUrl);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [step, setStep] = useState<Step>('otp-verify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Si pas d'username dans l'URL, rediriger vers la page de demande
    if (!username) {
      navigate('/forgot-password');
    }
  }, [username, navigate]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (otp.length !== 6) {
        setError('Le code OTP doit contenir 6 chiffres');
        setLoading(false);
        return;
      }

      const response = await apiClient.post<{ success: boolean; resetToken?: string; message: string }>(
        '/auth/validate-reset-otp',
        { username, otp }
      );

      if (response?.success && response.resetToken) {
        setResetToken(response.resetToken);
        setStep('password-reset');
        setOtp('');
      } else {
        setError(response?.message || 'Code OTP invalide');
      }
    } catch (err: any) {
      console.error('OTP validation error:', err);
      console.error('Error details:', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/auth/reset-password',
        { token: resetToken, password, confirmPassword }
      );

      if (response?.success) {
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response?.message || 'Erreur lors de la réinitialisation');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Success State
  if (step === 'success') {
    return (
      <Container>
        <CardContainer>
          <BackButton to="/login">
            <ArrowLeft size={18} />
            Retour à la connexion
          </BackButton>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <Title>Mot de passe réinitialisé</Title>
            <Subtitle>
              Votre mot de passe a été réinitialisé avec succès.
            </Subtitle>

            <Message type="info">
              <AlertCircle size={20} />
              <MessageText>
                Vous serez redirigé vers la page de connexion dans quelques secondes.
              </MessageText>
            </Message>

            <Button onClick={() => navigate('/login')} style={{ marginTop: '2rem' }}>
              Aller à la connexion
            </Button>

            <FooterText>
              Vous avez un compte? <LoginLink to="/login">Se connecter</LoginLink>
            </FooterText>
          </div>
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

        {step === 'otp-verify' ? (
          <>
            <Title>🔐 Vérifier le code 2FA</Title>
            <Subtitle>Entrez votre code OTP 2FA pour réinitialiser votre mot de passe</Subtitle>

            <Form onSubmit={handleVerifyOTP}>
              <FormGroup>
                <Label>Code OTP (6 chiffres)</Label>
                <OTPInputContainer>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <OTPInput
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => {
                        // Accepter seulement les chiffres 0-9
                        const digit = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                        
                        const newOtp = otp.split('');
                        newOtp[index] = digit;
                        setOtp(newOtp.join(''));
                        
                        // Auto-focus next input si un chiffre a été entré
                        if (digit && index < 5) {
                          const nextInput = document.querySelector(
                            `input[type="text"]:nth-of-type(${index + 3})`
                          ) as HTMLInputElement;
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      disabled={loading}
                    />
                  ))}
                </OTPInputContainer>
              </FormGroup>

              <Button type="submit" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Vérifier le code
                  </>
                )}
              </Button>
            </Form>
          </>
        ) : (
          <>
            <Title>🔑 Nouveau mot de passe</Title>
            <Subtitle>Créez un nouveau mot de passe sécurisé</Subtitle>

            <Form onSubmit={handleResetPassword}>
              <FormGroup>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  Min. 8 caractères avec majuscule, minuscule et chiffre
                </p>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmez votre nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </FormGroup>

              <Button type="submit" disabled={loading || !password || !confirmPassword}>
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Réinitialiser le mot de passe
                  </>
                )}
              </Button>
            </Form>
          </>
        )}

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

export default OTPVerificationPage;
