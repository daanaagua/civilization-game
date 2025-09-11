'use client';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ 
  current, 
  max, 
  label, 
  color = 'blue', 
  showPercentage = false,
  className = '' 
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-400">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}