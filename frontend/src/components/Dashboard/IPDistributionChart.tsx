import React, { useState, useEffect } from 'react';

interface IPData {
  label: string;
  value: number;
  color: string;
  percentage: number;
  change: number;
}

const IPDistributionChart: React.FC = () => {
  const [data, setData] = useState<IPData[]>([]);
  const [totalIPs, setTotalIPs] = useState(0);

  // Générer des données réalistes et dynamiques
  useEffect(() => {
    const generateData = () => {
      // Total d'IPs aléatoire (256 à 1024)
      const total = Math.floor(Math.random() * 768) + 256;
      
      // Distribution réaliste
      const allocated = Math.floor(total * (0.4 + Math.random() * 0.3)); // 40-70%
      const reserved = Math.floor(total * (0.1 + Math.random() * 0.1)); // 10-20%
      const available = total - allocated - reserved;
      
      const newData: IPData[] = [
        { 
          label: 'Disponible', 
          value: available, 
          color: '#3b82f6',
          percentage: Math.round((available / total) * 100),
          change: Math.round((Math.random() - 0.5) * 10)
        },
        { 
          label: 'Alloué', 
          value: allocated, 
          color: '#10b981',
          percentage: Math.round((allocated / total) * 100),
          change: Math.round((Math.random() - 0.5) * 10)
        },
        { 
          label: 'Réservé', 
          value: reserved, 
          color: '#f59e0b',
          percentage: Math.round((reserved / total) * 100),
          change: Math.round((Math.random() - 0.5) * 5)
        },
      ];
      
      setData(newData);
      setTotalIPs(total);
    };

    generateData();
    
    // Mettre à jour les données toutes les 60 secondes
    const interval = setInterval(generateData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Chargement...</div>;
  }

  // Calculer les angles pour le graphique donut
  let currentAngle = 0;
  const segments = data.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, startAngle, endAngle: currentAngle };
  });

  const centerX = 120;
  const centerY = 120;
  const radius = 80;
  const innerRadius = 50;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {/* Graphique donut */}
        <div className="relative" style={{ width: '280px', height: '280px' }}>
          <svg width="240" height="240" className="transform -rotate-90" style={{ margin: '20px' }}>
            {segments.map((segment, index) => (
              <g key={index} className="group">
                <path
                  d={createArcPath(segment.startAngle, segment.endAngle)}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
                  }}
                />
              </g>
            ))}
          </svg>

          {/* Texte central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{totalIPs}</div>
              <div className="text-xs text-gray-500 mt-1">Total IP</div>
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="flex-1 pl-8 space-y-4">
          {data.map((item, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-50 to-transparent rounded-lg p-4 hover:from-gray-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <span className={`text-sm font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                <span className="text-sm text-gray-500">{item.percentage}%</span>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}80`
                  }}
                ></div>
              </div>
            </div>
          ))}
          
          <div className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200">
            <div>Mis à jour: {new Date().toLocaleTimeString('fr-FR')}</div>
            <div className="mt-1">Utilisation: {Math.round(((totalIPs - data[0].value) / totalIPs) * 100)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDistributionChart;