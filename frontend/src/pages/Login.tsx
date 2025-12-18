import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../hooks/useAuth';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
    animation: ${float} 20s linear infinite;
    opacity: 0.1;
  }
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  position: relative;
  animation: ${fadeInUp} 0.8s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #60a5fa, #34d399, #a7f3d0);
    border-radius: 20px 20px 0 0;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
`;

const Logo = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(96, 165, 250, 0.3);
  animation: ${pulse} 2s infinite;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -3px;
    background: linear-gradient(45deg, #60a5fa, #34d399, #a7f3d0);
    border-radius: 23px;
    z-index: -1;
    opacity: 0.7;
    filter: blur(10px);
  }
`;

const LogoText = styled.span`
  color: white;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h1`
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #718096;
  font-size: 16px;
  margin: 0 0 32px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #f8fafc;
  color: #2d3748;

  &:focus {
    outline: none;
    border-color: #60a5fa;
    background: white;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    transform: translateY(-2px);
  }

  &::placeholder {
    color: #a0aec0;
  }

  &:hover {
    border-color: #cbd5e0;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(96, 165, 250, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
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

  &:hover::before {
    left: 100%;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #feb2b2;
`;

const DemoInfo = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: #f0f8ff;
  border-radius: 12px;
  border: 1px solid #bee3f8;
  text-align: center;
  
  h4 {
    color: #2b6cb0;
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  p {
    color: #2c5282;
    margin: 4px 0;
    font-size: 13px;
  }
`;

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.error || 'Identifiants invalides');
      }
      // Si succès, le hook useAuth va mettre à jour l'état et l'App sera re-rendered
    } catch (error) {
      console.error('Login error:', error);
      setError('Erreur de connexion au serveur LDAP');
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <Logo>
            <LogoText>N</LogoText>
          </Logo>
        </LogoContainer>

        <Title>NetAdmin Pro</Title>
        <Subtitle>Connectez-vous à votre espace d'administration</Subtitle>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGroup>
            <Label htmlFor="username">Nom d'utilisateur ou Email</Label>
            <InputContainer>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin ou admin@localhost.com"
                required
                autoComplete="username"
              />
            </InputContainer>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Mot de passe</Label>
            <InputContainer>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </InputContainer>
          </FormGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : 'Se connecter'}
          </SubmitButton>
        </Form>

        <DemoInfo>
          <h4>Authentification Locale</h4>
          <p>Utilisez vos identifiants de connexion</p>
          <p><small>Session valide 15 minutes après la dernière activité</small></p>
        </DemoInfo>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;