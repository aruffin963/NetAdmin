import { withLazyLoading } from '../components/Common/LazyLoading';

// Lazy loaded pages avec fallbacks personnalisés
export const LazyTopologyPage = withLazyLoading(
  () => import('../pages/TopologyPage'),
  {
    title: "Chargement de la topologie réseau...",
    description: "Préparation de la visualisation D3.js et récupération des équipements réseau"
  }
);

export const LazyMonitoringPage = withLazyLoading(
  () => import('../pages/Monitoring'),
  {
    title: "Chargement du monitoring...",
    description: "Récupération des métriques en temps réel et initialisation des graphiques"
  }
);

export const LazyScanPage = withLazyLoading(
  () => import('../pages/ScanPage'),
  {
    title: "Chargement du scanner IPAM...",
    description: "Initialisation des outils de scan et récupération des données de subnet"
  }
);

export const LazySubnettingPage = withLazyLoading(
  () => import('../pages/Subnetting'),
  {
    title: "Chargement des outils de subnetting...",
    description: "Préparation des calculateurs réseau et des outils de planification"
  }
);

export const LazyAlertsPage = withLazyLoading(
  () => import('../pages/Alerts'),
  {
    title: "Chargement des alertes...",
    description: "Récupération des notifications et événements système"
  }
);

export const LazyLogsPage = withLazyLoading(
  () => import('../pages/Logs'),
  {
    title: "Chargement des logs système...",
    description: "Récupération et indexation des journaux système"
  }
);

export const LazyProfilePage = withLazyLoading(
  () => import('../pages/ProfilePage'),
  {
    title: "Chargement du profil utilisateur...",
    description: "Récupération des informations et préférences utilisateur"
  }
);

