import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
  bgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, subtitle, icon: Icon, bgColor }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;