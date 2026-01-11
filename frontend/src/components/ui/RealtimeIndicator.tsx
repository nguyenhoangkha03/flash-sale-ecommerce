'use client';

interface RealtimeIndicatorProps {
  isConnected: boolean;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></div>
      <span className="text-sm font-medium text-gray-700">
        {isConnected ? (
          <>
            <span className="text-green-600">● Live</span>
          </>
        ) : (
          <>
            <span className="text-red-600">● Offline</span>
          </>
        )}
      </span>
    </div>
  );
};
