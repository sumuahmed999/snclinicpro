import React, { useState } from 'react';
import DoctorSelection from './DoctorSelection';
import DateSelection from './DateSelection';
import SlotSelection from './SlotSelection';
import FamilyMemberSelection from './FamilyMemberSelection';
import BookingConfirmation from './BookingConfirmation';
import PaymentGateway from './PaymentGateway';
import type { Doctor, Slot, FamilyMember } from '../../types';

export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface BookingFlowProps {
  onComplete?: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep(3);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleFamilyMemberSelect = (member: FamilyMember | null) => {
    setSelectedFamilyMember(member);
    setStep(5);
  };

  const handleBookingConfirm = (id: number) => {
    setAppointmentId(id);
    setStep(6);
  };

  const handlePaymentComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as BookingStep);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <DoctorSelection onSelect={handleDoctorSelect} />;
      
      case 2:
        return (
          <DateSelection
            doctor={selectedDoctor!}
            onSelect={handleDateSelect}
            onBack={handleBack}
          />
        );
      
      case 3:
        return (
          <SlotSelection
            doctor={selectedDoctor!}
            date={selectedDate!}
            onSelect={handleSlotSelect}
            onBack={handleBack}
          />
        );
      
      case 4:
        return (
          <FamilyMemberSelection
            onSelect={handleFamilyMemberSelect}
            onBack={handleBack}
          />
        );
      
      case 5:
        return (
          <BookingConfirmation
            doctor={selectedDoctor!}
            slot={selectedSlot!}
            familyMember={selectedFamilyMember}
            onConfirm={handleBookingConfirm}
            onBack={handleBack}
          />
        );
      
      case 6:
        return (
          <PaymentGateway
            appointmentId={appointmentId!}
            onComplete={handlePaymentComplete}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Progress Indicator */}
      <div className="mb-4 sm:mb-6 lg:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-sage-200">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Doctor' },
            { num: 2, label: 'Date' },
            { num: 3, label: 'Slot' },
            { num: 4, label: 'Family' },
            { num: 5, label: 'Confirm' },
            { num: 6, label: 'Payment' }
          ].map((item, index) => (
            <React.Fragment key={item.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all duration-300 ${
                    item.num < step
                      ? 'border-primary-500 bg-primary-500 text-white shadow-md'
                      : item.num === step
                      ? 'border-primary-500 bg-primary-500 text-white shadow-lg scale-110'
                      : 'border-sage-300 bg-white text-sage-400'
                  }`}
                >
                  {item.num < step ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-bold text-xs sm:text-sm lg:text-base">{item.num}</span>
                  )}
                </div>
                <span className={`mt-1 sm:mt-1.5 lg:mt-2 text-[10px] sm:text-xs font-medium ${
                  item.num <= step ? 'text-primary-500' : 'text-sage-500'
                }`}>
                  {item.label}
                </span>
              </div>
              {index < 5 && (
                <div className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 lg:mx-3 rounded-full transition-all duration-300 ${
                  item.num < step ? 'bg-primary-500' : 'bg-sage-200'
                }`}>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8 border border-sage-200 animate-slide-up">
        {renderStep()}
      </div>
    </div>
  );
};

export default BookingFlow;
