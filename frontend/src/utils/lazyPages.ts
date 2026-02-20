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



