import React, { useState } from 'react';
import { useDoctors } from '../../hooks/useDoctors';
import Button from '../common/Button';
import Input from '../common/Input';
import Loader from '../common/Loader';
import type { Doctor } from '../../types';

interface DoctorSelectionProps {
  onSelect: (doctor: Doctor) => void;
}

const DoctorSelection: React.FC<DoctorSelectionProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  
  const { data, isLoading, error } = useDoctors({
    is_active: true,
  });

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
        <p className="text-red-600">Failed to load doctors. Please try again.</p>
      </div>
    );
  }

  const doctors = data?.data || [];
  
  // Get unique specializations
  const specializations = Array.from(
    new Set(doctors.map((d) => d.specialization))
  );

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSpecialization =
      !specializationFilter || doctor.specialization === specializationFilter;
    return matchesSearch && matchesSpecialization;
  });

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-primary-500 mb-6">Select a Doctor</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search by doctor name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
        
        <select
          className="block w-full px-4 py-3 border border-sage-300 rounded-xl shadow-sm bg-white text-sage-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
        >
          <option value="">All Specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor List */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-sage-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sage-500">No doctors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="group border border-sage-200 rounded-xl p-5 hover:border-primary-500 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white"
              onClick={() => onSelect(doctor)}
            >
              <div className="flex items-start gap-4">
                {/* Doctor Image Circle */}
                <div className="flex-shrink-0">
                  {doctor.profile_photo ? (
                    <img
                      src={doctor.profile_photo}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 group-hover:border-primary-500 transition-colors"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 border-2 border-primary-200 group-hover:border-primary-500 flex items-center justify-center text-primary-600 font-bold text-xl transition-colors">
                      {doctor.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Doctor Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-primary-500 group-hover:text-primary-600 transition-colors mb-1">
                    {doctor.name}
                  </h3>
                  <p className="text-sm text-sage-600 mb-1">
                    {doctor.specialization}
                  </p>
                  <p className="text-xs text-sage-500 mb-3">
                    {doctor.qualification}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gold-600">
                      ₹{doctor.consultation_fee}
                    </p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(doctor);
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSelection;
