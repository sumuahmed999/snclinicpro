import React, { useState } from 'react';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import Button from '../common/Button';
import Loader from '../common/Loader';
import type { FamilyMember } from '../../types';

interface FamilyMemberSelectionProps {
  onSelect: (member: FamilyMember | null) => void;
  onBack: () => void;
}

const FamilyMemberSelection: React.FC<FamilyMemberSelectionProps> = ({
  onSelect,
  onBack,
}) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [bookingForSelf, setBookingForSelf] = useState(true);

  const { data, isLoading, error } = useFamilyMembers();

  const familyMembers = data?.data || [];

  const handleMemberClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setBookingForSelf(false);
  };

  const handleSelfClick = () => {
    setSelectedMember(null);
    setBookingForSelf(true);
  };

  const handleContinue = () => {
    onSelect(bookingForSelf ? null : selectedMember);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-primary-500 mb-2">
        Who is this appointment for?
      </h2>
      <p className="text-sage-600 mb-6">
        Select yourself or a family member
      </p>

      {/* Self Option */}
      <div
        onClick={handleSelfClick}
        className={`
          p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 mb-4
          ${bookingForSelf
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : 'border-sage-300 hover:border-primary-400 hover:bg-primary-50'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
              bookingForSelf ? 'bg-primary-100 border-2 border-primary-500' : 'bg-primary-100'
            }`}>
              <svg
                className={`w-6 h-6 ${bookingForSelf ? 'text-primary-600' : 'text-primary-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <div className={`font-semibold ${bookingForSelf ? 'text-primary-600' : 'text-primary-500'}`}>
                Myself
              </div>
              <div className={`text-sm ${bookingForSelf ? 'text-primary-600' : 'text-sage-600'}`}>
                Book for yourself
              </div>
            </div>
          </div>
          {bookingForSelf && (
            <svg
              className="w-6 h-6 text-primary-600"
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
      </div>

      {/* Family Members */}
      {familyMembers.length > 0 && (
        <>
          <div className="text-sm font-medium text-sage-700 mb-3">
            Or select a family member:
          </div>
          <div className="space-y-3 mb-6">
            {familyMembers.map((member) => {
              const isSelected = selectedMember?.id === member.id;
              
              return (
                <div
                  key={member.id}
                  onClick={() => handleMemberClick(member)}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-sage-300 hover:border-primary-400 hover:bg-primary-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        isSelected ? 'bg-primary-100 border-2 border-primary-500' : 'bg-sage-100'
                      }`}>
                        <svg
                          className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-sage-600'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className={`font-semibold ${isSelected ? 'text-primary-600' : 'text-primary-500'}`}>
                          {member.name}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-primary-600' : 'text-sage-600'}`}>
                          {member.relationship}
                          {member.date_of_birth && (
                            <> • {new Date().getFullYear() - new Date(member.date_of_birth).getFullYear()} years</>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-6 h-6 text-primary-600"
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
                </div>
              );
            })}
          </div>
        </>
      )}

      {error && (
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gold-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-gold-800">
              Unable to load family members. You can still book for yourself.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default FamilyMemberSelection;
