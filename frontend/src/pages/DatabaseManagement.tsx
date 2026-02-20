import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import {
  Database,
  Play,
  RotateCcw,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Upload,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useNotification } from '../context/NotificationContext';

// ============ STYLED COMPONENTS ============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  color: #000000;
  font-size: 32px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RefreshButton = styled.button`
  background: ${colors.primary.blue};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${colors.primary.blue};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  border-left: 3px solid #ef4444;
`;

const SuccessBox = styled.div`
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  border-left: 3px solid #22c55e;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h2`
  color: #000000;
  font-size: 16px;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`;

const CardValue = styled.div`
  color: #3b82f6;
  font-size: 32px;
  font-weight: 700;
  margin: 12px 0;
`;

const CardSubtext = styled.div`
  color: #6b7280;
  font-size: 12px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  color: #000000;
  font-size: 20px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.thead`
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 12px 16px;
  color: #374151;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  
  &:hover {
    background: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  color: #374151;
  font-size: 13px;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  
  ${props => {
    switch (props.status) {
      case 'success':
        return `background: #dcfce7; color: #166534;`;
      case 'pending':
        return `background: #fef3c7; color: #92400e;`;
      case 'failed':
        return `background: #fee2e2; color: #991b1b;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const ActionButton = styled.button<{ variant?: string }>`
  background: ${props => {
    switch (props.variant) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  }};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  gap: 12px;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ============ MAIN COMPONENT ============

const DatabaseManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showConfirm } = useNotification();
  
  const [stats, setStats] = useState<any>(null);
  const [migrations, setMigrations] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Charger le statut
      const statusRes = await fetch(`${API_BASE_URL}/database/status`);
      const statusData = await statusRes.json();
      if (statusData.success) setStats(statusData.data);

      // Charger les migrations
      const migrationsRes = await fetch(`${API_BASE_URL}/database/migrations`);
      const migrationsData = await migrationsRes.json();
      if (migrationsData.success) setMigrations(migrationsData.data);

      // Charger les backups
      const backupsRes = await fetch(`${API_BASE_URL}/database/backups`);
      const backupsData = await backupsRes.json();
      if (backupsData.success) setBackups(backupsData.data);
    } catch (err) {
      setError(`Error loading data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const runMigrations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/database/migrations/run`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(`✅ ${data.message}`);
        await loadData();
      } else {
        setError(`❌ ${data.message}`);
      }
    } catch (err) {
      setError(`Error running migrations: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const rollbackMigration = () => {
    showConfirm({
      title: 'Annuler la migration',
      message: 'Êtes-vous sûr de vouloir annuler la dernière migration? Cette action ne peut pas être annulée.',
      confirmText: 'Annuler',
      cancelText: 'Fermer',
      isDangerous: true,
      onConfirm: async () => {
        setLoading(true);
        setError('');
        
        try {
          const res = await fetch(`${API_BASE_URL}/database/migrations/rollback`, {
            method: 'POST',
          });
          const data = await res.json();
          
          if (data.success) {
            setSuccess(`✅ ${data.message}`);
            await loadData();
          } else {
            setError(`❌ ${data.message}`);
          }
        } catch (err) {
          setError(`Error rolling back: ${err}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const createBackup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/database/backup`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(`✅ ${data.message}`);
        await loadData();
      } else {
        setError(`❌ ${data.message}`);
      }
    } catch (err) {
      setError(`Error creating backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = (backupName: string) => {
    showConfirm({
      title: 'Restaurer la sauvegarde',
      message: `Êtes-vous sûr de vouloir restaurer "${backupName}"? Cela remplacera toutes les données actuelles!`,
      confirmText: 'Restaurer',
      cancelText: 'Annuler',
      isDangerous: true,
      onConfirm: async () => {
        setLoading(true);
        setError('');
        
        try {
          const res = await fetch(`${API_BASE_URL}/database/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupName }),
          });
          const data = await res.json();
          
          if (data.success) {
            setSuccess(`✅ ${data.message}`);
            await loadData();
          } else {
            setError(`❌ ${data.message}`);
          }
        } catch (err) {
          setError(`Error restoring backup: ${err}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const deleteBackup = (backupName: string) => {
    showConfirm({
      title: 'Supprimer la sauvegarde',
      message: `Êtes-vous sûr de vouloir supprimer "${backupName}"?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDangerous: true,
      onConfirm: async () => {
        setLoading(true);
        setError('');
        
        try {
          const res = await fetch(`${API_BASE_URL}/database/backups/${backupName}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          
          if (data.success) {
            setSuccess(`✅ ${data.message}`);
            await loadData();
          } else {
            setError(`❌ ${data.message}`);
          }
        } catch (err) {
          setError(`Error deleting backup: ${err}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container>
      <Header>
        <Title>
          <Database size={32} /> Database Management
        </Title>
        <RefreshButton onClick={loadData} disabled={loading}>
          {loading ? <LoadingSpinner /> : <RefreshCw size={16} />}
          {loading ? 'Loading...' : 'Refresh'}
        </RefreshButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}
      {success && <SuccessBox>{success}</SuccessBox>}

      {/* STATS CARDS */}
      <Section>
        <SectionTitle>Database Status</SectionTitle>
        <Grid>
          <Card>
            <CardTitle><HardDrive size={18} /> Database Size</CardTitle>
            <CardValue>{stats?.database?.size_mb} MB</CardValue>
            <CardSubtext>{stats?.database?.database}</CardSubtext>
          </Card>

          <Card>
            <CardTitle><Clock size={18} /> Active Connections</CardTitle>
            <CardValue>{stats?.database?.active_connections}</CardValue>
            <CardSubtext>Current connections</CardSubtext>
          </Card>

          <Card>
            <CardTitle><FileText size={18} /> Total Migrations</CardTitle>
            <CardValue>{stats?.migrations?.total || 0}</CardValue>
            <CardSubtext>
              Last: {stats?.migrations?.lastMigration?.version || 'N/A'}
            </CardSubtext>
          </Card>

          <Card>
            <CardTitle><Download size={18} /> Backups</CardTitle>
            <CardValue>{backups.length}</CardValue>
            <CardSubtext>Total available</CardSubtext>
          </Card>
        </Grid>
      </Section>

      {/* MIGRATIONS SECTION */}
      <Section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle>Migrations</SectionTitle>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionButton onClick={runMigrations} disabled={!migrations?.pending?.length || loading}>
              <Play size={14} /> Run Pending
            </ActionButton>
            <ActionButton variant="warning" onClick={rollbackMigration} disabled={!migrations?.executed?.length || loading}>
              <RotateCcw size={14} /> Rollback
            </ActionButton>
          </div>
        </div>

        {/* Pending Migrations */}
        {migrations?.pending?.length > 0 && (
          <Card>
            <CardTitle>Pending Migrations ({migrations.pending.length})</CardTitle>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Version</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {migrations.pending.map((m: any) => (
                  <TableRow key={m.version}>
                    <TableCell>{m.version}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      <StatusBadge status="pending">Pending</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Executed Migrations */}
        {migrations?.executed?.length > 0 && (
          <Card>
            <CardTitle>Executed Migrations ({migrations.executed.length})</CardTitle>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Version</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Executed</TableHeaderCell>
                  <TableHeaderCell>Duration</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {migrations.executed.map((m: any) => (
                  <TableRow key={m.version}>
                    <TableCell>{m.version}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{new Date(m.executed_at).toLocaleString()}</TableCell>
                    <TableCell>{m.duration_ms}ms</TableCell>
                    <TableCell>
                      <StatusBadge status={m.status}>
                        {m.status === 'success' && <CheckCircle size={12} />}
                        {m.status}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {!migrations?.executed?.length && !migrations?.pending?.length && (
          <Card>
            <EmptyState>
              <FileText size={40} />
              <div>No migrations found</div>
            </EmptyState>
          </Card>
        )}
      </Section>

      {/* BACKUPS SECTION */}
      <Section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle>Backups</SectionTitle>
          <ActionButton onClick={createBackup} disabled={loading}>
            <Download size={14} /> Create Backup
          </ActionButton>
        </div>

        {backups.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Backup Name</TableHeaderCell>
                  <TableHeaderCell>Size</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {backups.map((backup: any) => (
                  <TableRow key={backup.name}>
                    <TableCell>
                      <FileText size={14} style={{ display: 'inline', marginRight: '8px' }} />
                      {backup.name}
                    </TableCell>
                    <TableCell>{formatBytes(backup.size)}</TableCell>
                    <TableCell>{new Date(backup.created).toLocaleString()}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <ActionButton
                          onClick={() => restoreBackup(backup.name)}
                          disabled={loading}
                        >
                          <Upload size={12} /> Restore
                        </ActionButton>
                        <ActionButton
                          variant="danger"
                          onClick={() => deleteBackup(backup.name)}
                          disabled={loading}
                        >
                          <Trash2 size={12} /> Delete
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <EmptyState>
              <HardDrive size={40} />
              <div>No backups yet. Create one to get started.</div>
            </EmptyState>
          </Card>
        )}
      </Section>

      {/* WARNING */}
      <Card style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#92400e' }}>⚠️ Important</strong>
            <div style={{ color: '#92400e', fontSize: '12px', marginTop: '4px', lineHeight: '1.6' }}>
              • Always create a backup before running migrations<br />
              • Restore operations will replace all current data<br />
              • Rollback requires a .rollback.sql file for the migration<br />
              • Keep backups in a safe location (consider cloud storage)<br />
              • Test migrations on a development database first
            </div>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default DatabaseManagement;
