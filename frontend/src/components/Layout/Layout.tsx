import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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