import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Network, 
  Database,
  Bell,
  FileText,
  LogOut,
  User,
  UserCircle,
  Search,
  Key,
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../config/colors';

// Animations
const slideInLeft = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

// Styled Components
const SidebarContainer = styled.div`
  width: 280px;
  background: ${colors.sidebar.background};
  color: ${colors.sidebar.text};
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 4px 0 20px ${colors.shadow.md};
  animation: ${slideInLeft} 0.8s ease-out;
  display: flex;
  flex-direction: column;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, transparent 0%, ${colors.sidebar.border} 20%, ${colors.sidebar.border} 80%, transparent 100%);
  }
`;

const LogoSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${colors.sidebar.border};
  position: relative;
  flex-shrink: 0;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.sidebar.border}, transparent);
  }
`;

const LogoContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 1s ease-out 0.3s both;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${colors.primary.blue};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
  animation: ${pulse} 3s infinite;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
`;

const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.primary.blue};
`;

const Navigation = styled.nav`
  padding: 24px 16px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: ${colors.sidebar.border} transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.sidebar.border};
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MenuItem = styled.li`
  animation: ${fadeIn} 1s ease-out both;
`;

const MenuLink = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: ${props => props.$isActive ? colors.sidebar.activeText : colors.sidebar.textMuted};
  background: ${props => props.$isActive ? colors.sidebar.activeBackground : 'transparent'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid ${props => props.$isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    color: ${colors.sidebar.textHover};
    background: ${props => props.$isActive ? colors.sidebar.activeBackground : colors.sidebar.hoverBackground};
    transform: translateX(4px);
    box-shadow: ${props => props.$isActive ? '0 8px 25px rgba(37, 99, 235, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'};
      
    &::before {
      left: 100%;
    }
  }
  
  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
`;

const MenuText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const UserSection = styled.div`
  position: relative;
  padding: 24px;
  border-top: 1px solid ${colors.sidebar.border};
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.2) 100%);
  flex-shrink: 0;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${colors.sidebar.border};
  margin-bottom: 12px;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  background: ${colors.primary.blue};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  
  .name {
    font-size: 14px;
    font-weight: 600;
    color: ${colors.sidebar.text};
    margin: 0 0 2px 0;
  }
  
  .email {
    font-size: 12px;
    color: ${colors.sidebar.textMuted};
    margin: 0;
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: ${colors.semantic.danger};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: ${colors.neutral.white};
    transform: translateY(-1px);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const auth = useAuth();
  const { logout, user } = auth;

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard' 
    },
    { 
      path: '/monitoring', 
      icon: BarChart3, 
      label: 'Monitoring' 
    },
    { 
      path: '/logs', 
      icon: FileText, 
      label: 'Logs' 
    },
    { 
      path: '/subnetting', 
      icon: Network, 
      label: 'Subnetting' 
    },
    { 
      path: '/scan', 
      icon: Search, 
      label: 'Scanner' 
    },
    { 
      path: '/passwords', 
      icon: Key, 
      label: 'Mots de passe' 
    },
    { 
      path: '/database', 
      icon: Database, 
      label: 'Database' 
    },
    { 
      path: '/2fa', 
      icon: Shield, 
      label: '2FA Security' 
    },
    { 
      path: '/profile', 
      icon: UserCircle, 
      label: 'Profil' 
    },
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Paramètres' 
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SidebarContainer>
      {/* Logo */}
      <LogoSection>
        <LogoContent>
          <LogoIcon>
            <Shield />
          </LogoIcon>
          <LogoText>NetAdmin Pro</LogoText>
        </LogoContent>
      </LogoSection>

      {/* Navigation */}
      <Navigation>
        <MenuList>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <MenuItem key={item.path} style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                <MenuLink
                  to={item.path}
                  $isActive={isActive(item.path)}
                >
                  <Icon />
                  <MenuText>{item.label}</MenuText>
                </MenuLink>
              </MenuItem>
            );
          })}
        </MenuList>
      </Navigation>

      {/* User section */}
      <UserSection>
        <UserProfile>
          <UserAvatar>
            <User />
          </UserAvatar>
          <UserInfo>
            <p className="name">{user?.fullName || user?.username || 'Utilisateur'}</p>
            <p className="email">{user?.email || 'N/A'}</p>
          </UserInfo>
        </UserProfile>
        <LogoutButton onClick={handleLogout}>
          <LogOut />
          Déconnexion
        </LogoutButton>
      </UserSection>
    </SidebarContainer>
  );
};

export default Sidebar;