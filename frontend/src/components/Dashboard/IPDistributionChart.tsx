import React from 'react';

const IPDistributionChart: React.FC = () => {
  // Données pour le graphique donut
  const data = [
    { label: 'Disponible', value: 65, color: '#3b82f6' },
    { label: 'Alloué', value: 25, color: '#10b981' },
    { label: 'Réservé', value: 10, color: '#f59e0b' },
  ];

  // Calcul des angles pour le graphique donut
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      angle,
    };
  });

  const centerX = 120;
  const centerY = 120;
  const radius = 80;
  const innerRadius = 50;

  // Fonction pour créer le path de l'arc
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

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        {/* Graphique donut */}
        <svg width="240" height="240" className="transform -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={createArcPath(segment.startAngle, segment.endAngle)}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity"
            />
          ))}
        </svg>

        {/* Légende */}
        <div className="absolute -right-32 top-1/2 transform -translate-y-1/2 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">{item.value}%</span>
            </div>
          ))}
        </div>

        {/* Texte central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">210</div>
            <div className="text-sm text-gray-500">Total IP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDistributionChart;