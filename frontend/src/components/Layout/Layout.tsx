import React from 'react';
import styled from 'styled-components';
import { colors } from '../../config/colors';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${colors.background.primary};
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 280px;
  padding: 0;
  overflow-x: hidden;
  position: relative;
  min-height: 100vh;
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;