import React, { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  title: string;
  message: string;
  onComplete?: () => void;
  autoRedirectSeconds?: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  title,
  message,
  onComplete,
  autoRedirectSeconds = 3,
}) => {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="text-center py-12 animate-fade-in">
      {/* Animated Success Icon */}
      <div className="relative inline-block mb-6">
        {/* Outer ring animation */}
        <div className="absolute inset-0 w-24 h-24 bg-green-100 rounded-full animate-ping opacity-75"></div>
        
        {/* Success circle */}
        <div className="relative w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-scale-in">
          {/* Checkmark with draw animation */}
          <svg
            className="w-12 h-12 text-white animate-draw-check"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M5 13l4 4L19 7"
              className="checkmark-path"
            />
          </svg>
        </div>

        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: '50%',
                top: '50%',
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 4],
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 45}deg) translateY(-40px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Success Message */}
      <h3 className="text-3xl font-display font-bold text-primary-500 mb-3 animate-slide-up">
        {title}
      </h3>
      <p className="text-sage-600 text-lg mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {message}
      </p>

      {/* Countdown */}
      <div className="inline-flex items-center space-x-2 text-sage-500 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium">
          Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
        </span>
      </div>
    </div>
  );
};

export default SuccessAnimation;
