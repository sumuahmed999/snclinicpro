import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { slotService } from '../../services/slots';
import Button from '../common/Button';
import Loader from '../common/Loader';
import type { Doctor, Slot } from '../../types';

interface SlotSelectionProps {
  doctor: Doctor;
  date: string;
  onSelect: (slot: Slot) => void;
  onBack: () => void;
}

const SlotSelection: React.FC<SlotSelectionProps> = ({
  doctor,
  date,
  onSelect,
  onBack,
}) => {
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);

  // Fetch slots with auto-refresh every 30 seconds
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doctor-slots', doctor.id, date],
    queryFn: () => slotService.getDoctorSlots(doctor.id, { date }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const slots = data?.data || [];

  const formatTime = (time: string) => {
    // Convert 24h format to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    // Append T00:00:00 to parse as local time, not UTC
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSlotStatus = (slot: Slot) => {
    if (slot.is_past) {
      return { label: 'Past', color: 'gray', disabled: true };
    }
    if (slot.is_full) {
      return { label: 'Full', color: 'red', disabled: true };
    }
    const available = slot.available_capacity || 0;
    if (available <= 2) {
      return { label: `${available} left`, color: 'orange', disabled: false };
    }
    return { label: `${available} available`, color: 'green', disabled: false };
  };

  const handleSlotClick = (slot: Slot) => {
    const status = getSlotStatus(slot);
    if (!status.disabled) {
      setSelectedSlot(slot);
    }
  };

  const handleContinue = () => {
    if (selectedSlot) {
      onSelect(selectedSlot);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load slots. Please try again.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-primary-500 mb-2">Select a Time Slot</h2>
      <p className="text-sage-600 mb-1">
        <span className="font-semibold text-primary-500">{doctor.name}</span> - {doctor.specialization}
      </p>
      <p className="text-sage-600 mb-6">{formatDate(date)}</p>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-between mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl">
        <div className="flex items-center text-sm text-sage-700">
          <svg
            className="w-4 h-4 mr-2 text-primary-600 animate-spin-slow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Availability updates automatically every 30 seconds
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Refresh Now
        </Button>
      </div>

      {/* Slots Grid */}
      {slots.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-sage-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sage-500">No slots available for this date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {slots.map((slot) => {
            const status = getSlotStatus(slot);
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                disabled={status.disabled}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
                    : status.disabled
                    ? 'border-sage-200 bg-sage-50 cursor-not-allowed opacity-60'
                    : 'border-sage-300 hover:border-primary-400 hover:bg-primary-50 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-lg font-semibold ${isSelected ? 'text-primary-700' : 'text-primary-500'}`}>
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </div>
                  {isSelected && (
                    <svg
                      className="w-5 h-5 text-primary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isSelected ? 'text-primary-600' : 'text-sage-600'}`}>
                    Capacity: {slot.max_capacity}
                  </span>
                  <span
                    className={`
                      text-xs font-medium px-2 py-1 rounded-lg
                      ${isSelected
                        ? 'bg-primary-100 text-primary-700'
                        : status.color === 'green'
                        ? 'bg-green-100 text-green-800'
                        : status.color === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : status.color === 'red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-sage-100 text-sage-800'
                      }
                    `}
                  >
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedSlot}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default SlotSelection;
