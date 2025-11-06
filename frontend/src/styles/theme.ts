// Theme de base pour styled-components
export const theme = {
  colors: {
    primary: {
      main: '#007bff',
      light: '#66b3ff',
      dark: '#0056b3'
    },
    success: {
      main: '#28a745',
      light: '#d4edda',
      dark: '#155724'
    },
    error: {
      main: '#dc3545',
      light: '#f8d7da',
      dark: '#721c24'
    },
    warning: {
      main: '#ffc107',
      light: '#fff3cd',
      dark: '#856404'
    },
    info: {
      main: '#17a2b8',
      light: '#d1ecf1',
      dark: '#0c5460'
    },
    neutral: {
      main: '#6c757d',
      light: '#e9ecef',
      dark: '#495057'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
      disabled: '#dee2e6'
    },
    border: '#dee2e6'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px'
  },
  shadows: {
    small: '0 1px 3px rgba(0,0,0,0.12)',
    medium: '0 4px 6px rgba(0,0,0,0.12)',
    large: '0 10px 20px rgba(0,0,0,0.12)'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};

export type Theme = typeof theme;