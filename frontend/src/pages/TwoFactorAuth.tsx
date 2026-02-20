import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Copy, Download, RotateCw, Trash2, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../utils/api';
import { useNotification } from '../context/NotificationContext';

/**
 * Page de configuration 2FA avec TOTP
 */

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 28px;
    margin-bottom: 0.5rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: #2563eb;
    }
  }

  p {
    color: #666;
    margin: 0;
  }
`;

const StatusCard = styled.div<{ enabled: boolean }>`
  background: ${(props) => (props.enabled ? '#ecfdf5' : '#f3f4f6')};
  border: 1px solid ${(props) => (props.enabled ? '#86efac' : '#e5e7eb')};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    width: 24px;
    height: 24px;
    color: ${(props) => (props.color ? props.color : '#666')};
  }
`;

const StatusText = styled.div`
  h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  background: ${(props) => {
    switch (props.variant) {
      case 'danger':
        return '#ef4444';
      case 'secondary':
        return '#f3f4f6';
      default:
        return '#2563eb';
    }
  }};

  color: ${(props) => (props.variant === 'secondary' ? '#333' : '#fff')};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SetupSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  img {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    background: #f9fafb;
  }

  p {
    color: #666;
    text-align: center;
    font-size: 14px;
  }
`;

const SecretContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  p {
    color: #666;
    margin: 0;
    font-size: 14px;
  }
`;

const SecretBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
  display: flex;
  justify-content: space-between;
  align-items: center;

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #2563eb;
    padding: 0.25rem;

    &:hover {
      color: #1d4ed8;
    }
  }
`;

// const VerificationForm = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
// `;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const BackupCodesContainer = styled.div`
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;

  h4 {
    margin: 0 0 0.75rem 0;
    color: #92400e;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    margin: 0 0 1rem 0;
    color: #78350f;
    font-size: 14px;
  }
`;

const CodesList = styled.div`
  background: white;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  max-height: 250px;
  overflow-y: auto;

  code {
    display: block;
    margin-bottom: 0.5rem;
    font-family: monospace;
    color: #333;
    font-size: 14px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th {
    background: #f3f4f6;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ success?: boolean }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => (props.success ? '#d1fae5' : '#fee2e2')};
  color: ${(props) => (props.success ? '#065f46' : '#7f1d1d')};
`;

interface TwoFAStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  lastVerified: string | null;
  createdAt: string | null;
}

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface LoginHistory {
  id: number;
  success: boolean;
  method: 'totp' | 'backup_code';
  ip_address: string;
  timestamp: string;
}

export default function TwoFactorAuth() {
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const { showConfirm } = useNotification();
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [history, setHistory] = useState<LoginHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Charger le statut 2FA
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/2fa/status');
      setStatus((response as any)?.data || response || null);

      if ((response as any)?.enabled || (response as any)?.data?.enabled) {
        fetchHistory();
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setMessage({ type: 'error', text: 'Failed to load 2FA status' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('/auth/2fa/history');
      setHistory((response as any)?.history || (response as any)?.data?.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const startSetup = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/2fa/setup');
      setSetupData((response as any)?.data || {});
      setMessage({ type: 'success', text: 'Setup started. Scan QR code with authenticator app.' });
    } catch (error) {
      console.error('Error starting setup:', error);
      setMessage({ type: 'error', text: 'Failed to start 2FA setup' });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!setupData || !verificationCode) {
      setMessage({ type: 'error', text: 'Please enter verification code' });
      return;
    }

    try {
      setVerifying(true);
      await apiClient.post('/auth/2fa/verify', {
        secret: setupData.secret,
        token: verificationCode,
        backupCodes: setupData.backupCodes,
      });

      setMessage({ type: 'success', text: '✅ 2FA enabled successfully!' });
      setSetupData(null);
      setVerificationCode('');
      setTimeout(() => fetchStatus(), 1000);
    } catch (error: any) {
      console.error('Error verifying setup:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Invalid code. Please try again.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const disableTwoFA = () => {
    showConfirm({
      title: 'Désactiver 2FA',
      message: 'Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs pour votre compte?',
      confirmText: 'Désactiver',
      cancelText: 'Annuler',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await apiClient.post('/auth/2fa/disable');
          setMessage({ type: 'success', text: '❌ 2FA disabled' });
          setSetupData(null);
          setTimeout(() => fetchStatus(), 1000);
        } catch (error) {
          console.error('Error disabling 2FA:', error);
          setMessage({ type: 'error', text: 'Failed to disable 2FA' });
        }
      }
    });
  };

  const generateNewBackupCodes = () => {
    showConfirm({
      title: 'Générer de nouveaux codes de sauvegarde',
      message: 'Les anciens codes de sauvegarde seront invalidés. Êtes-vous sûr de vouloir continuer?',
      confirmText: 'Générer',
      cancelText: 'Annuler',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await apiClient.post('/auth/2fa/generate-backup-codes');
          setSetupData({
            secret: '',
            qrCode: '',
            backupCodes: (response as any)?.backupCodes || [],
          });
          setShowBackupCodes(true);
          setMessage({ type: 'success', text: 'New backup codes generated' });
        } catch (error) {
          console.error('Error generating backup codes:', error);
          setMessage({ type: 'error', text: 'Failed to generate backup codes' });
        }
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy' });
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = setupData.backupCodes.join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', 'backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setMessage({ type: 'success', text: 'Backup codes downloaded' });
  };

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <h1>
            <Shield /> Two-Factor Authentication
          </h1>
          <p>Loading...</p>
        </Header>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h1>
          <Shield /> Two-Factor Authentication
        </h1>
        <p>Secure your account with TOTP-based authentication</p>
      </Header>

      {message && (
        <div
          style={{
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: message.type === 'success' ? '#065f46' : '#7f1d1d',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <StatusCard enabled={status?.enabled || false}>
        <StatusInfo>
          {status?.enabled ? (
            <>
              <CheckCircle color="#16a34a" />
              <StatusText>
                <h3>2FA Enabled ✅</h3>
                <p>Your account is protected with TOTP authentication</p>
              </StatusText>
            </>
          ) : (
            <>
              <AlertCircle color="#999" />
              <StatusText>
                <h3>2FA Disabled</h3>
                <p>Add two-factor authentication for enhanced security</p>
              </StatusText>
            </>
          )}
        </StatusInfo>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!status?.enabled ? (
            <Button variant="primary" onClick={startSetup}>
              Enable 2FA
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={generateNewBackupCodes}>
                <RotateCw size={16} style={{ marginRight: '0.5rem' }} />
                New Codes
              </Button>
              <Button variant="danger" onClick={disableTwoFA}>
                <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
                Disable
              </Button>
            </>
          )}
        </div>
      </StatusCard>

      {/* Setup Section */}
      {setupData && !showBackupCodes && (
        <Card>
          <CardTitle>Step 1: Scan QR Code</CardTitle>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft
            Authenticator, etc.)
          </p>

          <SetupSection>
            <QRContainer>
              {setupData.qrCode && (
                <>
                  <img src={setupData.qrCode} alt="TOTP QR Code" />
                  <p>📱 Scan with your authenticator app</p>
                </>
              )}
            </QRContainer>

            <SecretContainer>
              <div>
                <p>Can't scan? Enter this code manually:</p>
                <SecretBox>
                  <code>{setupData.secret}</code>
                  <button onClick={() => copyToClipboard(setupData.secret)}>
                    <Copy size={16} />
                  </button>
                </SecretBox>
              </div>

              <div>
                <label htmlFor="totp-code" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Enter the 6-digit code from your app:
                </label>
                <Input
                  id="totp-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <Button
                variant="primary"
                onClick={verifySetup}
                disabled={verifying || verificationCode.length !== 6}
              >
                {verifying ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </SecretContainer>
          </SetupSection>
        </Card>
      )}

      {/* Backup Codes Section */}
      {setupData?.backupCodes && setupData.backupCodes.length > 0 && (
        <Card>
          <CardTitle>💾 Backup Codes</CardTitle>
          <BackupCodesContainer>
            <h4>
              <AlertCircle size={18} /> Save these codes in a safe place!
            </h4>
            <p>
              Each code can be used once if you lose access to your authenticator app. Never share
              these codes.
            </p>
            <CodesList>
              {setupData.backupCodes.map((code, index) => (
                <code key={index}>{code}</code>
              ))}
            </CodesList>

            <ActionButtons>
              <Button variant="primary" onClick={downloadBackupCodes}>
                <Download size={16} style={{ marginRight: '0.5rem' }} />
                Download Codes
              </Button>
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
              >
                <Copy size={16} style={{ marginRight: '0.5rem' }} />
                Copy All
              </Button>
            </ActionButtons>
          </BackupCodesContainer>
        </Card>
      )}

      {/* Status Details */}
      {status?.enabled && (
        <>
          <Card>
            <CardTitle>Account Status</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>2FA Status</p>
                <Badge success={true}>Enabled</Badge>
              </div>
              <div>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>Backup Codes</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                  {status.backupCodesRemaining || 0} remaining
                </p>
              </div>
              {status.lastVerified && (
                <div>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>Last Verified</p>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {new Date(status.lastVerified).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* History */}
          <Card>
            <CardTitle style={{ marginBottom: '1rem' }}>
              📊 Login History
              <Button
                variant="secondary"
                style={{
                  marginLeft: 'auto',
                  padding: '0.5rem 1rem',
                  fontSize: '13px',
                }}
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'Show'}
              </Button>
            </CardTitle>

            {showHistory && history.length > 0 ? (
              <HistoryTable>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.timestamp).toLocaleString()}</td>
                      <td>{entry.method === 'totp' ? '🔐 TOTP' : '📄 Backup Code'}</td>
                      <td>
                        <Badge success={entry.success}>
                          {entry.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '12px', color: '#666' }}>{entry.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </HistoryTable>
            ) : (
              <p style={{ color: '#666' }}>No login history available</p>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}
