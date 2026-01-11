'use client';

import { useEffect, useState } from 'react';

interface ReservationTimerProps {
  expiresAt: string | Date;
  onExpired?: () => void;
}

export const ReservationTimer: React.FC<ReservationTimerProps> = ({
  expiresAt,
  onExpired,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft('Đã hết hạn');
        setIsExpired(true);
        onExpired?.();
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setSecondsLeft(Math.ceil(difference / 1000));
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  // Determine color based on time left
  let colorClass = 'text-green-600'; // > 5 min
  if (secondsLeft <= 300) colorClass = 'text-yellow-600'; // 0-5 min
  if (secondsLeft <= 60) colorClass = 'text-red-600'; // < 1 min
  if (isExpired) colorClass = 'text-red-700';

  return (
    <div className={`text-center py-4 px-4 bg-gray-50 rounded-lg border-2 border-dashed ${isExpired ? 'border-red-300' : 'border-gray-200'}`}>
      <p className="text-sm text-gray-600 mb-2">Thời gian còn lại</p>
      {isExpired ? (
        <p className="text-2xl font-bold text-red-700">Đã hết hạn</p>
      ) : (
        <p className={`text-3xl font-bold ${colorClass}`}>{timeLeft}</p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        {isExpired ? 'Đơn giữ hàng đã hết hạn' : 'Hoàn tất thanh toán trong thời gian này'}
      </p>
    </div>
  );
};
