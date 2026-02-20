import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { colors } from '../config/colors';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Lock, Shield, Server, BarChart3, Clock } from 'lucide-react';
import apiClient from '../utils/api';

// Animations
const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(96, 165, 250, 0.8);
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled Components
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${colors.sidebar.background};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%);
    animation: ${float} 20s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%);
    animation: ${float} 25s ease-in-out infinite reverse;
  }
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 40px;
  position: relative;
  z-index: 1;
  animation: ${fadeInLeft} 1s ease-out;

  @media (max-width: 768px) {
    display: none;
  }
`;

const RightSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  position: relative;
  z-index: 1;
  animation: ${fadeInRight} 1s ease-out;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const BrandLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 48px;
  
  svg {
    width: 48px;
    height: 48px;
    color: #60a5fa;
  }
`;

const BrandName = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin: 0;
  background: ${colors.primary.blue};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BrandTagline = styled.p`
  font-size: 14px;
  color: #cbd5e0;
  margin-top: 4px;
`;

const Features = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 48px;
`;

const FeatureItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  svg {
    width: 24px;
    height: 24px;
    color: #34d399;
    flex-shrink: 0;
    margin-top: 4px;
  }

  div {
    h4 {
      color: white;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    p {
      color: #a0aec0;
      font-size: 14px;
      margin: 0;
      line-height: 1.4;
    }
  }
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const LoginCard = styled.div`
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent);
  }

  &::after {
    content: '';
    position: absolute;
    top: -1px;
    left: 20%;
    right: 20%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.3), transparent);
    filter: blur(1px);
  }
`;

const Title = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #a0aec0;
  margin: 0 0 32px 0;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
  font-weight: 500;

  &:focus {
    outline: none;
    border-color: #60a5fa;
    background: rgba(15, 23, 42, 1);
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.2);
  }

  &::placeholder {
    color: #64748b;
  }

  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
  }
`;

const PasswordStrengthBar = styled.div<{ strength: number }>`
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.strength}%;
    background: ${props => {
      if (props.strength < 30) return '#ef4444';
      if (props.strength < 60) return '#f97316';
      if (props.strength < 90) return '#eab308';
      return '#22c55e';
    }};
    transition: all 0.3s ease;
  }
`;

const StrengthText = styled.span<{ strength: number }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => {
    if (props.strength < 30) return '#ef4444';
    if (props.strength < 60) return '#f97316';
    if (props.strength < 90) return '#eab308';
    return '#22c55e';
  }};
  margin-top: 4px;
  display: inline-block;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #60a5fa;
  }

  label {
    cursor: pointer;
    font-size: 14px;
    color: #cbd5e0;
    font-weight: 500;
    margin: 0;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${colors.primary.blue};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(96, 165, 250, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled)::before {
    left: 100%;
  }
`;

const LoadingSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    flex-shrink: 0;
  }
`;

const HelperText = styled.p`
  font-size: 12px;
  color: #64748b;
  margin: 8px 0 0 0;
`;

const SwitchMethodButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #60a5fa;
  border: 2px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;

  &:hover {
    border-color: #60a5fa;
    background: rgba(96, 165, 250, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const Footer = styled.div`
  margin-top: 24px;
  text-align: center;

  a {
    color: #60a5fa;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.3s ease;

    &:hover {
      color: #3b82f6;
      text-decoration: underline;
    }
  }
`;

const FooterLink = styled(Link)`
  color: #60a5fa;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;

  &:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
`;

const DemoInfo = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: rgba(96, 165, 250, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  text-align: center;

  h4 {
    color: #60a5fa;
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
  }

  p {
    color: #cbd5e0;
    margin: 4px 0;
    font-size: 12px;
  }
`;

const Login: React.FC = () => {
  const [username, setUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberUsername') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberMe') === 'true';
    }
    return false;
  });
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState<number | null>(null); // Store userId for 2FA verification
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  // Validation states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Username or Email validation
  const validateUsernameOrEmail = (value: string): string => {
    if (!value) return 'Le nom d\'utilisateur ou email est requis';
    
    // Check if it's an email format
    if (value.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Format email invalide';
      }
    } else {
      // It's a username
      if (value.length < 3) return 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Format invalide (lettres, chiffres, _, -)';
    }
    return '';
  };

  // Password validation
  const validatePassword = (value: string): string => {
    if (!value) return 'Le mot de passe est requis';
    if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
    return '';
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsernameOrEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const calculatePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15;
    return Math.min(100, strength);
  };

  const passwordStrength = calculatePasswordStrength(password);

  const getPasswordStrengthText = (): string => {
    if (passwordStrength < 30) return 'Faible';
    if (passwordStrength < 60) return 'Moyen';
    if (passwordStrength < 90) return 'Bon';
    return 'Excellent';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameError('');
    setPasswordError('');

    // Validate fields
    const usernameErr = validateUsernameOrEmail(username);
    const passwordErr = validatePassword(password);

    if (usernameErr) {
      setUsernameError(usernameErr);
      setError('Veuillez corriger les erreurs');
      return;
    }

    if (passwordErr) {
      setPasswordError(passwordErr);
      setError('Veuillez corriger les erreurs');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberUsername', username);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberUsername');
      localStorage.removeItem('rememberMe');
    }

    try {
      const result = await login(username, password);
      if (result.requires2FA) {
        setRequires2FA(true);
        setTwoFAUserId(result.userId || null);
        setTotpCode('');
        setBackupCode('');
      } else if (!result.success) {
        // Better error messages based on backend response
        if (result.error?.includes('Invalid credentials')) {
          setError('Nom d\'utilisateur ou mot de passe incorrect');
        } else if (result.error?.includes('inactive')) {
          setError('Votre compte est désactivé. Veuillez contacter l\'administrateur');
        } else {
          setError(result.error || 'Erreur de connexion');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erreur de connexion au serveur. Veuillez réessayer');
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let code = useBackupCode ? backupCode : totpCode;
    
    // Trim whitespace
    code = code.trim();

    if (!code) {
      setError(useBackupCode ? 'Entrez votre code de secours' : 'Entrez le code de votre application');
      return;
    }

    // Validate TOTP code format (should be 6-8 digits)
    if (!useBackupCode && !/^\d{6,8}$/.test(code)) {
      setError('Le code TOTP doit être 6 à 8 chiffres');
      return;
    }

    try {
      setVerifying2FA(true);
      const endpoint = useBackupCode ? '/auth/2fa/verify-backup-code' : '/auth/2fa/verify-token';
      const payload = useBackupCode 
        ? { code, userId: twoFAUserId } // Pass userId for login-time verification
        : { token: code, userId: twoFAUserId }; // Pass userId for login-time verification

      console.log('Sending 2FA verification:', { endpoint, userId: twoFAUserId, codeLength: code.length });

      const response = await apiClient.post(endpoint, payload);
      console.log('2FA verification response:', response.data);
      
      if (response.data.success) {
        // Wait a bit for session cookies to be set, then redirect
        console.log('2FA successful, redirecting to dashboard in 500ms...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError(response.data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Code invalide. Veuillez réessayer.';
      setError(errorMsg);
    } finally {
      setVerifying2FA(false);
    }
  };

  // 2FA Verification Form
  if (requires2FA) {
    return (
      <LoginContainer>
        <RightSection style={{ flex: 1, width: '100%' }}>
          <LoginCard>
            <Title>Vérification 2FA</Title>
            <Subtitle>Complétez la vérification à deux facteurs</Subtitle>

            <LoginForm onSubmit={handle2FAVerification}>
              {error && (
                <ErrorMessage>
                  <AlertCircle size={18} />
                  {error}
                </ErrorMessage>
              )}

              {!useBackupCode ? (
                <>
                  <FormGroup>
                    <Label htmlFor="totp-code">Code d'authentification</Label>
                    <InputContainer>
                      <Input
                        id="totp-code"
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </InputContainer>
                    <HelperText>Entrez le code 6 chiffres de votre application authenticator</HelperText>
                  </FormGroup>

                  <SubmitButton type="submit" disabled={verifying2FA || totpCode.length !== 6}>
                    {verifying2FA && <LoadingSpinner />}
                    Vérifier le code
                  </SubmitButton>

                  <SwitchMethodButton type="button" onClick={() => setUseBackupCode(true)}>
                    Utiliser un code de secours
                  </SwitchMethodButton>
                </>
              ) : (
                <>
                  <FormGroup>
                    <Label htmlFor="backup-code">Code de secours</Label>
                    <InputContainer>
                      <Input
                        id="backup-code"
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX"
                        required
                        autoFocus
                      />
                    </InputContainer>
                    <HelperText>Format: XXXX-XXXX-XXXX (l'un de vos codes sauvegardés)</HelperText>
                  </FormGroup>

                  <SubmitButton type="submit" disabled={verifying2FA || !backupCode}>
                    {verifying2FA && <LoadingSpinner />}
                    Vérifier le code
                  </SubmitButton>

                  <SwitchMethodButton type="button" onClick={() => { setUseBackupCode(false); setTotpCode(''); }}>
                    Utiliser l'application authenticator
                  </SwitchMethodButton>
                </>
              )}
            </LoginForm>
          </LoginCard>
        </RightSection>
      </LoginContainer>
    );
  }

  // Main Login Form
  return (
    <LoginContainer>
      <LeftSection>
        <div>
          <BrandLogo>
            <Shield size={40} strokeWidth={1.5} />
            <div>
              <BrandName>NetAdmin</BrandName>
              <BrandTagline>Pro Administration</BrandTagline>
            </div>
          </BrandLogo>

          <h3 style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: '700', margin: '0 0 32px 0' }}>
            Gérez votre infrastructure
          </h3>

          <Features>
            <FeatureItem>
              <Server strokeWidth={1.5} />
              <div>
                <h4>Surveillance en temps réel</h4>
                <p>Monitorer vos serveurs, réseaux et applications 24/7</p>
              </div>
            </FeatureItem>

            <FeatureItem>
              <BarChart3 strokeWidth={1.5} />
              <div>
                <h4>Analyses détaillées</h4>
                <p>Dashboards intuitifs avec métriques clés et alertes</p>
              </div>
            </FeatureItem>

            <FeatureItem>
              <Lock strokeWidth={1.5} />
              <div>
                <h4>Sécurité renforcée</h4>
                <p>Authentification 2FA et contrôle d'accès granulaire</p>
              </div>
            </FeatureItem>

            <FeatureItem>
              <Clock strokeWidth={1.5} />
              <div>
                <h4>Réponse rapide</h4>
                <p>Alertes instantanées et actions automatisées</p>
              </div>
            </FeatureItem>
          </Features>
        </div>
      </LeftSection>

      <RightSection>
        <LoginCard>
          <Title>Bienvenue</Title>
          <Subtitle>Connectez-vous à votre compte</Subtitle>

          <LoginForm onSubmit={handleSubmit}>
            {error && (
              <ErrorMessage>
                <AlertCircle size={18} />
                {error}
              </ErrorMessage>
            )}

            <FormGroup>
              <Label htmlFor="username">
                Identifiant (email ou nom d'utilisateur)
                {username && !usernameError && <span style={{ color: '#10b981', marginLeft: '8px' }}>✓</span>}
              </Label>
              <InputContainer>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="admin ou admin@netadmin.local"
                  required
                  autoComplete="username"
                  autoFocus
                  style={{ borderColor: usernameError ? '#ef4444' : 'inherit' }}
                />
              </InputContainer>
              {usernameError && (
                <ErrorMessage style={{ marginTop: '6px', fontSize: '12px' }}>
                  <AlertCircle size={14} style={{ marginRight: '4px' }} />
                  {usernameError}
                </ErrorMessage>
              )}
              {username && !usernameError && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#10b981' }}>
                  ✓ Format valide
                </div>
              )}
            </FormGroup>

            <FormGroup>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Label htmlFor="password">
                  Mot de passe
                  {password && !passwordError && <span style={{ color: '#10b981', marginLeft: '8px' }}>✓</span>}
                </Label>
                {password && <StrengthText strength={passwordStrength}>Force: {getPasswordStrengthText()}</StrengthText>}
              </div>
              <InputContainer>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '44px', borderColor: passwordError ? '#ef4444' : 'inherit' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#60a5fa',
                    padding: '4px',
                    fontSize: '16px',
                  }}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </InputContainer>
              {passwordError && (
                <ErrorMessage style={{ marginTop: '6px', fontSize: '12px' }}>
                  <AlertCircle size={14} style={{ marginRight: '4px' }} />
                  {passwordError}
                </ErrorMessage>
              )}
              {password && !passwordError && <PasswordStrengthBar strength={passwordStrength} />}
            </FormGroup>

            <CheckboxGroup>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me">Mémoriser cet appareil</label>
            </CheckboxGroup>

            <SubmitButton 
              type="submit" 
              disabled={isLoading || !username || !password}
            >
              {isLoading && <LoadingSpinner />}
              {isLoading ? 'Connexion...' : 'SE CONNECTER'}
            </SubmitButton>
          </LoginForm>

          <Footer>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '13px' }}>
              <FooterLink to="/forgot-password" title="Réinitialiser votre mot de passe">Mot de passe oublié?</FooterLink>
              <span style={{ color: '#64748b' }}>•</span>
              <a href="#register" title="Créer un nouveau compte">Créer un compte</a>
              <span style={{ color: '#64748b' }}>•</span>
              <a href="#change-password" title="Changer votre mot de passe">Changer le mot de passe</a>
            </div>
          </Footer>

          <DemoInfo>
            <h4>👤 Compte démo</h4>
            <p><strong>admin</strong> / <strong>password</strong></p>
          </DemoInfo>
        </LoginCard>
      </RightSection>
    </LoginContainer>
  );
};

export default Login;