import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Loader, Modal } from '../common';
import { useDoctors } from '../../hooks/useDoctors';
import { useSlots } from '../../hooks/useSlots';
import { appointmentService, type ManualBookingData } from '../../services/appointments';
import { patientService } from '../../services/patients';
import { formatTime, todayLocalDate } from '../../utils/formatters';
import type { User, Doctor, Slot } from '../../types';
import { NewPatientForm } from './NewPatientForm';

interface ManualBookingProps {
  onSuccess?: () => void;
}

export const ManualBooking = ({ onSuccess }: ManualBookingProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'search' | 'select-slot' | 'confirm'>('search');
  
  // Patient search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  
  // New patient state
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  
  // Patient confirmation guard — staff must explicitly confirm the right patient
  const [patientConfirmed, setPatientConfirmed] = useState(false);
  
  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayLocalDate());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'pending'>('pending');
  const [notes, setNotes] = useState('');
  
  // Fetch doctors
  const { data: doctorsData } = useDoctors();
  const doctors = doctorsData?.data || [];
  
  // Fetch slots when doctor and date are selected
  const { data: slotsData, isLoading: slotsLoading } = useSlots({
    doctor_id: selectedDoctor?.id,
    date: selectedDate,
  });
  const slots = slotsData?.data || [];
  
  // Search patients mutation
  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await patientService.searchPatients(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Manual booking mutation
  const bookingMutation = useMutation({
    mutationFn: (data: ManualBookingData) => appointmentService.manualBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['staff-appointments'] });
      
      // Reset form
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    },
  });
  
  const resetForm = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPatientConfirmed(false);
    setShowNewPatientForm(false);
    setSelectedDoctor(null);
    setSelectedDate(todayLocalDate());
    setSelectedSlot(null);
    setPaymentMethod('pending');
    setNotes('');
  };
  
  const handleSelectPatient = (patient: User) => {
    setSelectedPatient(patient);
    setPatientConfirmed(false); // Reset confirmation when a new patient is selected
    setStep('select-slot');
  };
  
  const handleNewPatient = async (data: { name: string; mobile: string; email: string }) => {
    try {
      // Create the patient first
      const response = await patientService.createPatient({
        name: data.name,
        mobile: data.mobile,
        email: data.email || undefined,
      });

      // Set the created patient
      setSelectedPatient(response.data);
      setShowNewPatientForm(false);
      setStep('select-slot');
    } catch (error: any) {
      console.error('Failed to create patient:', error);
      alert(error.response?.data?.message || 'Failed to create patient. Please try again.');
    }
  };
  
  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };
  
  const handleConfirmBooking = () => {
    if (!selectedSlot || !selectedPatient) return;
    
    const bookingData: ManualBookingData = {
      user_id: selectedPatient.id,
      slot_id: selectedSlot.id,
      payment_status: paymentMethod === 'pending' ? 'pending' : 'paid',
      payment_method: paymentMethod === 'pending' ? undefined : paymentMethod,
      notes: notes || undefined,
    };
    
    bookingMutation.mutate(bookingData);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <StepIndicator
            number={1}
            label="Patient"
            active={step === 'search'}
            completed={step !== 'search'}
          />
          <div className="w-16 h-0.5 bg-gray-300" />
          <StepIndicator
            number={2}
            label="Slot"
            active={step === 'select-slot'}
            completed={step === 'confirm'}
          />
          <div className="w-16 h-0.5 bg-gray-300" />
          <StepIndicator
            number={3}
            label="Confirm"
            active={step === 'confirm'}
            completed={false}
          />
        </div>
      </div>
      
      {/* Step 1: Patient Search */}
      {step === 'search' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search or Create Patient
          </h2>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                fullWidth
                placeholder="Search by name, mobile, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              />
              <Button onClick={searchPatients} isLoading={isSearching}>
                Search
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">
                      {patient.mobile} • {patient.email}
                    </p>
                  </div>
                ))}
                <div className="p-3 bg-amber-50 text-center">
                  <p className="text-xs text-amber-700 mb-2">
                    Not the right patient? Try a different search before creating a new record.
                  </p>
                  <button
                    onClick={() => setShowNewPatientForm(true)}
                    className="text-xs text-amber-800 underline hover:text-amber-900"
                  >
                    None of these — create new patient
                  </button>
                </div>
              </div>
            )}
            
            {/* No Results */}
            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <p className="text-gray-600 mb-1">No patients found for "<strong>{searchQuery}</strong>"</p>
                <p className="text-xs text-amber-700 mb-4">
                  ⚠ Before creating a new record, try searching with a different spelling or mobile number to avoid duplicates.
                </p>
                <Button onClick={() => setShowNewPatientForm(true)} variant="primary">
                  Create New Patient
                </Button>
              </div>
            )}
            
            {/* Or Create New */}
            {!searchQuery && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600 mb-4">
                  Search for an existing patient or create a new one
                </p>
                <Button onClick={() => setShowNewPatientForm(true)} variant="primary">
                  Create New Patient
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Step 2: Select Slot */}
      {step === 'select-slot' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Select Appointment Slot
              </h2>
              <Button size="sm" variant="outline" onClick={() => setStep('search')}>
                Change Patient
              </Button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                Patient: {selectedPatient?.name}
              </p>
              <p className="text-sm text-gray-600">{selectedPatient?.mobile}</p>
            </div>
            
            {/* Doctor Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor
              </label>
              <select
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doctor = doctors.find((d) => d.id === Number(e.target.value));
                  setSelectedDoctor(doctor || null);
                  setSelectedSlot(null);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Selection */}
            {selectedDoctor && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  min={todayLocalDate()}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          
          {/* Slots Grid */}
          {selectedDoctor && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Slots
              </h3>
              
              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  No available slots for this date
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={slot.is_full || slot.is_past}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        slot.is_full || slot.is_past
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <p className="font-medium text-sm">{formatTime(slot.start_time)}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {slot.available_capacity}/{slot.max_capacity} available
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Confirm Booking */}
      {step === 'confirm' && selectedSlot && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm Booking
            </h2>
            <Button size="sm" variant="outline" onClick={() => setStep('select-slot')}>
              Change Slot
            </Button>
          </div>
          
          {/* Booking Summary */}
          <div className="space-y-4 mb-6">
            {/* Patient verification card — staff must confirm they selected the right patient */}
            <div className={`p-4 rounded-lg border-2 ${patientConfirmed ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
                    ⚠ Verify Patient Identity
                  </p>
                  <p className="font-semibold text-gray-900">{selectedPatient?.name}</p>
                  <p className="text-sm text-gray-700">📱 {selectedPatient?.mobile}</p>
                  {selectedPatient?.email && (
                    <p className="text-sm text-gray-600">✉ {selectedPatient.email}</p>
                  )}
                </div>
                <button
                  onClick={() => setStep('search')}
                  className="text-xs text-amber-700 underline hover:text-amber-900 flex-shrink-0"
                >
                  Wrong patient?
                </button>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientConfirmed}
                  onChange={(e) => setPatientConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-sm font-medium text-gray-800">
                  I confirm this is the correct patient
                </span>
              </label>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Appointment Details</h3>
              <p className="text-sm text-gray-600">
                Doctor: {selectedDoctor?.name}
              </p>
              <p className="text-sm text-gray-600">Date: {selectedDate}</p>
              <p className="text-sm text-gray-600">
                Time: {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
              </p>
              <p className="text-sm text-gray-600">
                Fee: ₹{selectedDoctor?.consultation_fee}
              </p>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className="font-medium text-sm">Cash</p>
              </button>
              <button
                onClick={() => setPaymentMethod('online')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  paymentMethod === 'online'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className="font-medium text-sm">Online</p>
              </button>
              <button
                onClick={() => setPaymentMethod('pending')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  paymentMethod === 'pending'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className="font-medium text-sm">Pending</p>
              </button>
            </div>
          </div>
          
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this appointment"
            />
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              fullWidth
              variant="primary"
              onClick={handleConfirmBooking}
              isLoading={bookingMutation.isPending}
              disabled={!patientConfirmed || bookingMutation.isPending}
            >
              {patientConfirmed ? 'Confirm Booking' : 'Confirm Patient Identity First'}
            </Button>
            <Button fullWidth variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
          
          {bookingMutation.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Failed to create booking. Please try again.
              </p>
            </div>
          )}
          
          {bookingMutation.isSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Booking created successfully!
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* New Patient Modal */}
      {showNewPatientForm && (
        <Modal
          isOpen={showNewPatientForm}
          onClose={() => setShowNewPatientForm(false)}
          title="Create New Patient"
        >
          <NewPatientForm
            onSubmit={handleNewPatient}
            onCancel={() => setShowNewPatientForm(false)}
            isLoading={false}
          />
        </Modal>
      )}
    </div>
  );
};

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

const StepIndicator = ({ number, label, active, completed }: StepIndicatorProps) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          completed
            ? 'bg-green-500 text-white'
            : active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {completed ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          number
        )}
      </div>
      <p className={`mt-2 text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>
        {label}
      </p>
    </div>
  );
};
