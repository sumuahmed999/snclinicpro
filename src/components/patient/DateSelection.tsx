import React, { useState } from 'react';
import Button from '../common/Button';
import type { Doctor } from '../../types';

interface DateSelectionProps {
  doctor: Doctor;
  onSelect: (date: string) => void;
  onBack: () => void;
}

const DateSelection: React.FC<DateSelectionProps> = ({ doctor, onSelect, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Generate next 7 days (1 week)
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const dates = generateDates();
  
  // Check if doctor works on this day
  const isDoctorAvailable = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return doctor.working_days?.includes(dayName) || false;
  };

  const formatDate = (date: Date) => {
    // Use local date parts to avoid UTC timezone shift
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
  };

  const handleContinue = () => {
    if (selectedDate) {
      onSelect(selectedDate);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-primary-500 mb-2">Select a Date</h2>
      <p className="text-sage-600 mb-6">
        Booking appointment with <span className="font-semibold text-primary-500">{doctor.name}</span>
      </p>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {dates.map((date) => {
          const dateStr = formatDate(date);
          const isAvailable = isDoctorAvailable(date);
          const isSelected = selectedDate === dateStr;
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => isAvailable && handleDateClick(date)}
              disabled={!isAvailable}
              className={`
                p-3 rounded-xl border-2 text-center transition-all duration-200
                ${isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-105'
                  : isAvailable
                  ? 'border-sage-300 hover:border-primary-400 hover:bg-primary-50 hover:shadow-sm'
                  : 'border-sage-200 bg-sage-100 text-sage-400 cursor-not-allowed'
                }
              `}
            >
              <div className="text-xs font-medium">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold mt-1">
                {date.getDate()}
              </div>
              <div className="text-xs">
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </div>
              {isToday && (
                <div className={`text-xs font-medium mt-1 ${isSelected ? 'text-primary-700' : 'text-primary-600'}`}>
                  Today
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Working Days Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-sage-700">
            <span className="font-semibold">Working Days:</span>{' '}
            {doctor.working_days?.join(', ') || 'Not specified'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedDate}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default DateSelection;
