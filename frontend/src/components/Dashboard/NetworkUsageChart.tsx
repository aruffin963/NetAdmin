import React from 'react';

const NetworkUsageChart: React.FC = () => {
  // Données simulées pour le graphique
  const data = [
    { time: '00:00', value: 45 },
    { time: '04:00', value: 23 },
    { time: '08:00', value: 67 },
    { time: '12:00', value: 89 },
    { time: '16:00', value: 76 },
    { time: '20:00', value: 54 },
    { time: '24:00', value: 43 },
  ];

  return (
    <div className="h-64 flex items-end justify-between bg-gradient-to-t from-blue-50 to-white rounded-lg p-4">
      {/* Simulation d'un graphique en ligne */}
      <div className="relative w-full h-full">
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Grille de fond */}
          <defs>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Ligne du graphique */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,180 80,200 160,120 240,60 320,80 400,140 480,170"
          />
          
          {/* Points sur la ligne */}
          {[0, 80, 160, 240, 320, 400, 480].map((x, index) => {
            const y = [180, 200, 120, 60, 80, 140, 170][index];
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                className="opacity-80"
              />
            );
          })}
        </svg>
        
        {/* Labels des heures */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 -mb-6">
          {data.map((point, index) => (
            <span key={index}>{point.time}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkUsageChart;