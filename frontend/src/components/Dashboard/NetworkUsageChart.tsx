// import React, { useState, useEffect } from 'react';

// interface ChartData {
//   time: string;
//   download: number;
//   upload: number;
//   total: number;
// }

// const NetworkUsageChart: React.FC = () => {
//   const [data, setData] = useState<ChartData[]>([]);
//   const [maxValue, setMaxValue] = useState(100);

//   // Générer des données réalistes et dynamiques
//   useEffect(() => {
//     const generateData = () => {
//       const now = new Date();
//       const newData: ChartData[] = [];
      
//       // Générer 24 points de données (une pour chaque heure)
//       for (let i = 23; i >= 0; i--) {
//         const time = new Date(now.getTime() - i * 60 * 60 * 1000);
//         const hour = time.getHours().toString().padStart(2, '0');
//         const minute = time.getMinutes().toString().padStart(2, '0');
        
//         // Simulation avec tendance réaliste (moins le matin, plus le soir)
//         const baseValue = 30 + (hour % 24) * 2;
//         const download = baseValue + Math.random() * 40;
//         const upload = baseValue * 0.6 + Math.random() * 20;
//         const total = download + upload;
        
//         newData.push({
//           time: `${hour}:${minute}`,
//           download: Math.round(download),
//           upload: Math.round(upload),
//           total: Math.round(total)
//         });
//       }
      
//       setData(newData);
//       const max = Math.max(...newData.map(d => d.total));
//       setMaxValue(Math.ceil(max / 10) * 10);
//     };

//     generateData();
    
//     // Mettre à jour les données toutes les 30 secondes
//     const interval = setInterval(generateData, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   if (data.length === 0) {
//     return <div className="h-64 flex items-center justify-center text-gray-400">Chargement...</div>;
//   }

//   // Calculer la largeur de chaque barre
//   const barWidth = 100 / data.length;
  
//   // Fonction pour convertir une valeur en hauteur de pixel
//   const getHeight = (value: number) => {
//     return (value / maxValue) * 100;
//   };

//   // Sélectionner certains labels pour éviter le surcharge
//   const labelIndices = data.length > 12 
//     ? [0, Math.floor(data.length / 6), Math.floor(data.length / 3), Math.floor(data.length / 2), Math.floor(data.length * 2 / 3), data.length - 1]
//     : Array.from({ length: data.length }, (_, i) => i);

//   return (
//     <div className="w-full">
//       {/* Graphique */}
//       <div className="relative h-64 bg-gradient-to-b from-blue-50/50 to-transparent rounded-lg p-4 mb-8">
//         <div className="absolute inset-0 flex items-end gap-1 px-4 pb-8">
//           {data.map((point, index) => (
//             <div
//               key={index}
//               className="flex-1 flex flex-col items-center relative group"
//               style={{ height: '100%' }}
//             >
//               {/* Barre stacked (Download + Upload) */}
//               <div className="w-full bg-white/30 rounded-t" style={{ height: '100%', position: 'relative' }}>
//                 {/* Upload (partie supérieure) */}
//                 <div
//                   className="w-full bg-gradient-to-t from-amber-400 to-amber-300 rounded-t transition-all duration-300 hover:from-amber-500 hover:to-amber-400"
//                   style={{
//                     height: `${getHeight(point.upload)}%`,
//                     position: 'absolute',
//                     bottom: `${getHeight(point.download)}%`,
//                   }}
//                 />
//                 {/* Download (partie inférieure) */}
//                 <div
//                   className="w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded-b transition-all duration-300 hover:from-blue-500 hover:to-blue-400"
//                   style={{
//                     height: `${getHeight(point.download)}%`,
//                     position: 'absolute',
//                     bottom: 0,
//                   }}
//                 />
//               </div>
              
//               {/* Tooltip au survol */}
//               <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
//                 <div className="font-semibold">{point.time}</div>
//                 <div className="text-blue-300">↓ {point.download} Mbps</div>
//                 <div className="text-amber-300">↑ {point.upload} Mbps</div>
//                 <div className="text-gray-300 border-t border-gray-700 mt-1 pt-1">Total: {point.total} Mbps</div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Axe Y (valeurs) */}
//         <div className="absolute left-0 top-0 bottom-0 text-right text-xs text-gray-500 pr-2 py-4">
//           <div style={{ height: '25%' }}>{Math.round(maxValue * 0.75)} Mbps</div>
//           <div style={{ height: '25%' }}>{Math.round(maxValue * 0.5)} Mbps</div>
//           <div style={{ height: '25%' }}>{Math.round(maxValue * 0.25)} Mbps</div>
//           <div style={{ height: '25%' }}>0 Mbps</div>
//         </div>
//       </div>

//       {/* Légende */}
//       <div className="flex gap-6 text-sm">
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-300 rounded"></div>
//           <span className="text-gray-600">Téléchargement</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 bg-gradient-to-r from-amber-400 to-amber-300 rounded"></div>
//           <span className="text-gray-600">Envoi</span>
//         </div>
//         <div className="ml-auto text-gray-500">
//           Mis à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NetworkUsageChart;