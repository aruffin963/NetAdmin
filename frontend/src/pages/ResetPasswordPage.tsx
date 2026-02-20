import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, AlertCircle, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';
import apiClient from '../services/api';

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const CardContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 3rem;
  max-width: 500px;
  width: 100%;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 2rem;
  transition: color 0.2s;

  &:hover {
    color: #764ba2;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
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
  color: #374151;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;

  &:hover {
    color: #374151;
  }
`;

const PasswordStrength = styled.div<{ strength: 'weak' | 'fair' | 'good' | 'strong' }>`
  margin-top: 0.5rem;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    background: ${props => {
      switch (props.strength) {
        case 'weak':
          return '#ef4444';
        case 'fair':
          return '#f97316';
        case 'good':
          return '#eab308';
        case 'strong':
          return '#22c55e';
        default:
          return '#e5e7eb';
      }
    }};
    width: ${props => {
      switch (props.strength) {
        case 'weak':
          return '25%';
        case 'fair':
          return '50%';
        case 'good':
          return '75%';
        case 'strong':
          return '100%';
        default:
          return '0%';
      }
    }};
    transition: width 0.2s;
  }
`;

const PasswordRequirements = styled.div`
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
`;

const Requirement = styled.div<{ met: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => (props.met ? '#16a34a' : '#6b7280')};
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  &::before {
    content: ${props => (props.met ? '"✓"' : '"○"')};
    font-weight: bold;
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ type: 'error' | 'success' | 'warning' }>`
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: ${props => {
    switch (props.type) {
      case 'error':
        return '#fee2e2';
      case 'success':
        return '#dcfce7';
      case 'warning':
        return '#fef3c7';
      default:
        return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'error':
        return '#991b1b';
      case 'success':
        return '#166534';
      case 'warning':
        return '#92400e';
      default:
        return '#374151';
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
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const SuccessMessage = styled.p`
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const InfoBox = styled.div`
  background: #dbeafe;
  border-left: 4px solid #0284c7;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  color: #0c4a6e;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const FooterText = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 1.5rem;
`;

const LoginLink = styled(Link)`
  color: #667eea;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

// ============= UTILITIES =============

const calculatePasswordStrength = (password: string): 'weak' | 'fair' | 'good' | 'strong' => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  
  switch (strength) {
    case 0:
    case 1:
      return 'weak';
    case 2:
      return 'fair';
    case 3:
      return 'good';
    case 4:
      return 'strong';
    default:
      return 'weak';
  }
};

const validatePassword = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
};

const isPasswordValid = (validations: ReturnType<typeof validatePassword>) => {
  return Object.values(validations).every(v => v);
};

// ============= COMPONENT =============

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  const passwordValidations = validatePassword(password);
  const passwordStrength = calculatePasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = isPasswordValid(passwordValidations) && passwordsMatch && !validating;

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token manquant. Vérifiez votre lien.');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.post<{ valid: boolean; email?: string }>(
          '/auth/validate-reset-token',
          { token }
        );

        if (response?.valid) {
          setTokenValid(true);
          setUserEmail(response.email || '');
        } else {
          setError('Ce lien de réinitialisation est invalide ou expiré.');
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de valider le lien.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setValidating(true);
    setError('');

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/auth/reset-password',
        {
          token,
          password,
          confirmPassword,
        }
      );

      if (response?.success) {
        setSubmitted(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response?.message || 'Erreur lors de la réinitialisation.');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setValidating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container>
        <CardContainer>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Loader size={40} style={{ animation: 'spin 2s linear infinite' }} />
          </div>
        </CardContainer>
      </Container>
    );
  }

  // Token not valid
  if (!tokenValid) {
    return (
      <Container>
        <CardContainer>
          <BackButton to="/login">
            <ArrowLeft size={18} />
            Retour à la connexion
          </BackButton>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <Title>Lien expiré ou invalide</Title>
            <Subtitle style={{ marginTop: '1rem' }}>
              {error || 'Ce lien de réinitialisation n\'est pas valide.'}
            </Subtitle>

            <Message type="error" style={{ marginTop: '2rem' }}>
              <AlertCircle size={20} />
              <MessageText>
                Les liens de réinitialisation expirent après 1 heure. Veuillez demander un nouveau lien.
              </MessageText>
            </Message>

            <Button onClick={() => navigate('/forgot-password')} style={{ marginTop: '2rem' }}>
              Demander un nouveau lien
            </Button>

            <FooterText>
              Vous avez un compte? <LoginLink to="/login">Se connecter</LoginLink>
            </FooterText>
          </div>
        </CardContainer>
      </Container>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Container>
        <CardContainer>
          <SuccessContainer>
            <SuccessIcon>✅</SuccessIcon>
            <SuccessTitle>Mot de passe réinitialisé</SuccessTitle>
            <SuccessMessage>
              Votre mot de passe a été réinitialisé avec succès. Vous serez redirigé vers la page de connexion.
            </SuccessMessage>

            <InfoBox>
              Un email de confirmation a été envoyé à {userEmail}. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </InfoBox>

            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <Loader size={20} style={{ animation: 'spin 2s linear infinite', margin: '0 auto' }} />
              <p style={{ marginTop: '0.5rem' }}>Redirection en cours...</p>
            </div>

            <FooterText>
              <LoginLink to="/login">Aller à la connexion</LoginLink>
            </FooterText>
          </SuccessContainer>
        </CardContainer>
      </Container>
    );
  }

  // Form state
  return (
    <Container>
      <CardContainer>
        <BackButton to="/login">
          <ArrowLeft size={18} />
          Retour à la connexion
        </BackButton>

        <Title>🔑 Réinitialiser le mot de passe</Title>
        <Subtitle>Créez un nouveau mot de passe sécurisé pour votre compte</Subtitle>

        {error && (
          <Message type="error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <MessageText>{error}</MessageText>
          </Message>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <InputWrapper>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Entrez votre nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={validating}
                autoFocus
              />
              <ToggleButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={validating}
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </ToggleButton>
            </InputWrapper>

            {password && (
              <>
                <PasswordStrength strength={passwordStrength} />
                <PasswordRequirements>
                  <Requirement met={passwordValidations.minLength}>
                    Au moins 8 caractères
                  </Requirement>
                  <Requirement met={passwordValidations.hasUppercase}>
                    Une lettre majuscule
                  </Requirement>
                  <Requirement met={passwordValidations.hasLowercase}>
                    Une lettre minuscule
                  </Requirement>
                  <Requirement met={passwordValidations.hasNumber}>
                    Un chiffre
                  </Requirement>
                </PasswordRequirements>
              </>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <InputWrapper>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmez votre nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={validating}
              />
              <ToggleButton
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={validating}
                title={showConfirmPassword ? 'Masquer' : 'Afficher'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </ToggleButton>
            </InputWrapper>

            {confirmPassword && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {passwordsMatch ? (
                  <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} />
                    Les mots de passe correspondent
                  </div>
                ) : (
                  <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    Les mots de passe ne correspondent pas
                  </div>
                )}
              </div>
            )}
          </FormGroup>

          <Button type="submit" disabled={!canSubmit || validating}>
            {validating ? (
              <>
                <Loader size={18} className="animate-spin" />
                Réinitialisation en cours...
              </>
            ) : (
              <>
                <Lock size={18} />
                Réinitialiser le mot de passe
              </>
            )}
          </Button>
        </Form>

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

export default ResetPasswordPage;
