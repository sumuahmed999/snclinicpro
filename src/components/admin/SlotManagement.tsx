import React, { useState, useEffect } from 'react';
import { slotService } from '../../services/slots';
import type { CreateSlotData } from '../../services/slots';
import { doctorService } from '../../services/doctors';
import type { Slot, Doctor } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { formatDate, formatTime } from '../../utils/formatters';
import { Layout } from '../layout';

const SlotManagement: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDoctorId, setFilterDoctorId] = useState<number | undefined>(undefined);
  // Default to today so we only load upcoming slots
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSlots, setTotalSlots] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState<Slot | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDoctorId, filterDate]);

  useEffect(() => {
    fetchSlots();
  }, [filterDoctorId, filterDate, currentPage]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getDoctors({ is_active: true });
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await slotService.getSlots({
        doctor_id: filterDoctorId,
        date: filterDate || undefined,
        page: currentPage,
        per_page: 10,
      } as any);
      // Backend now returns { success, data, total, per_page, current_page, last_page }
      const raw = response as any;
      if (raw.success !== undefined) {
        setSlots(raw.data || []);
        setTotalPages(raw.last_page || 1);
        setTotalSlots(raw.total || 0);
      } else if (Array.isArray(raw.data)) {
        setSlots(raw.data);
        setTotalPages(1);
        setTotalSlots(raw.data.length);
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    setEditingSlot(null);
    setIsModalOpen(true);
  };

  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const handleDeleteSlot = async (slot: Slot) => {
    try {
      await slotService.deleteSlot(slot.id);
      fetchSlots();
      setDeleteConfirmSlot(null);
    } catch (error) {
      console.error('Failed to delete slot:', error);
      alert('Failed to delete slot');
    }
  };

  if (loading && slots.length === 0) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 max-w-7xl mx-auto animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 rounded w-36"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          {/* Filter skeleton */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          {/* Table skeleton */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="bg-gray-50 px-6 py-3 flex gap-6">
              {['Doctor','Date','Time','Capacity','Booked','Status','Actions'].map(h => (
                <div key={h} className="h-4 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-t border-gray-100 flex gap-6 items-center">
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded-full w-14"></div>
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Slot Management</h1>
        <div className="space-x-3">
          <Button onClick={() => setIsBulkModalOpen(true)} variant="secondary">
            Bulk Create Slots
          </Button>
          <Button onClick={handleAddSlot}>
            Add Single Slot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Doctor
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterDoctorId || ''}
              onChange={(e) => { setFilterDoctorId(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(1); }}
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Filter by Date"
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
            fullWidth
          />
        </div>
      </div>

      {/* Slots Table */}
      <div className={`bg-white rounded-lg shadow overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {slots.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No slots found
                </td>
              </tr>
            ) : (
              slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {slot.doctor?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {slot.doctor?.specialization}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(slot.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{slot.max_capacity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {slot.booked_count} / {slot.max_capacity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        slot.is_full
                          ? 'bg-red-100 text-red-800'
                          : slot.is_past
                          ? 'bg-gray-100 text-gray-800'
                          : slot.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {slot.is_full ? 'Full' : slot.is_past ? 'Past' : slot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditSlot(slot)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmSlot(slot)}
                      className="text-red-600 hover:text-red-900"
                      disabled={slot.booked_count > 0}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalSlots > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{((currentPage - 1) * 10) + 1}–{Math.min(currentPage * 10, totalSlots)}</span> of <span className="font-semibold text-gray-700">{totalSlots}</span> slots
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ‹ Prev
            </button>
            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm border rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-[#1a4d3e] text-white border-[#1a4d3e]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <SlotFormModal
          slot={editingSlot}
          doctors={doctors}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchSlots();
          }}
        />
      )}

      {/* Bulk Create Modal */}
      {isBulkModalOpen && (
        <BulkSlotFormModal
          doctors={doctors}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            setIsBulkModalOpen(false);
            fetchSlots();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSlot && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmSlot(null)}
          title="Confirm Delete"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this slot? This action cannot be undone.
            </p>
            {deleteConfirmSlot.booked_count > 0 && (
              <p className="text-red-600 text-sm">
                Warning: This slot has {deleteConfirmSlot.booked_count} booking(s).
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmSlot(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteSlot(deleteConfirmSlot)}
                disabled={deleteConfirmSlot.booked_count > 0}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </Layout>
  );
};

// Slot Form Modal Component
interface SlotFormModalProps {
  slot: Slot | null;
  doctors: Doctor[];
  onClose: () => void;
  onSuccess: () => void;
}

const SlotFormModal: React.FC<SlotFormModalProps> = ({ slot, doctors, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateSlotData>({
    doctor_id: slot?.doctor_id || 0,
    date: slot?.date || '',
    start_time: slot?.start_time ? slot.start_time.substring(0, 5) : '',
    end_time: slot?.end_time ? slot.end_time.substring(0, 5) : '',
    max_capacity: slot?.max_capacity || 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      if (slot) {
        await slotService.updateSlot(slot.id, {
          doctor_id: formData.doctor_id,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          max_capacity: formData.max_capacity,
        });
      } else {
        await slotService.createSlot(formData);
      }
      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save slot');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={slot ? 'Edit Slot' : 'Add Slot'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Doctor - full width */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Doctor <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.doctor_id}
            onChange={(e) => setFormData({ ...formData, doctor_id: Number(e.target.value) })}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </select>
          {errors.doctor_id && <p className="mt-0.5 text-xs text-red-600">{errors.doctor_id[0]}</p>}
        </div>

        {/* Date + Capacity in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="mt-0.5 text-xs text-red-600">{errors.date[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max Capacity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              value={formData.max_capacity}
              onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.max_capacity && <p className="mt-0.5 text-xs text-red-600">{errors.max_capacity[0]}</p>}
          </div>
        </div>

        {/* Start + End Time in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_time && <p className="mt-0.5 text-xs text-red-600">{errors.start_time[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">End Time <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.end_time && <p className="mt-0.5 text-xs text-red-600">{errors.end_time[0]}</p>}
          </div>
        </div>

        {slot && slot.booked_count > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            ⚠ This slot has {slot.booked_count} existing booking{slot.booked_count > 1 ? 's' : ''}. Capacity cannot be set below this.
          </p>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>{slot ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
};

// Bulk Slot Form Modal Component
interface BulkSlotFormModalProps {
  doctors: Doctor[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkSlotFormModal: React.FC<BulkSlotFormModalProps> = ({ doctors, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    doctor_id: 0,
    start_date: '',
    end_date: '',
    time_slots: [{ start_time: '09:00', end_time: '10:00' }],
    max_capacity: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      time_slots: [...formData.time_slots, { start_time: '', end_time: '' }],
    });
  };

  const removeTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      time_slots: formData.time_slots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newSlots = [...formData.time_slots];
    newSlots[index][field] = value;
    setFormData({ ...formData, time_slots: newSlots });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await slotService.bulkCreateSlots({
        doctor_id: formData.doctor_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        time_slots: formData.time_slots,
        max_capacity: formData.max_capacity,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create slots:', error);
      const msg = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create slots';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Bulk Create Slots"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* How it works hint */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          <strong>How it works:</strong> Select a doctor, date range, and add one or more time slots per day.
          Each time slot will be created for <strong>every day</strong> in the date range.
          <br />Example: 3 days × 2 time slots = <strong>6 slots total</strong>.
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Doctor <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.doctor_id}
            onChange={(e) => setFormData({ ...formData, doctor_id: Number(e.target.value) })}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date <span className="text-red-500">*</span></label>
            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date <span className="text-red-500">*</span></label>
            <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Time slots */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">
              Time Slots per Day <span className="text-red-500">*</span>
              <span className="ml-2 text-gray-400 font-normal">({formData.time_slots.length} slot{formData.time_slots.length > 1 ? 's' : ''} per day)</span>
            </label>
            <button
              type="button"
              onClick={addTimeSlot}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Time Slot
            </button>
          </div>
          <div className="space-y-2">
            {formData.time_slots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-gray-400 w-5">#{index + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Start</label>
                    <input type="time" value={slot.start_time} onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)} required className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">End</label>
                    <input type="time" value={slot.end_time} onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)} required className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                {formData.time_slots.length > 1 && (
                  <button type="button" onClick={() => removeTimeSlot(index)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Capacity + preview */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max Capacity per Slot <span className="text-red-500">*</span></label>
            <input type="number" min="1" value={formData.max_capacity} onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {formData.start_date && formData.end_date && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700 text-center">
              {(() => {
                const start = new Date(formData.start_date + 'T00:00:00');
                const end = new Date(formData.end_date + 'T00:00:00');
                const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
                const total = days * formData.time_slots.length;
                return <><strong>{total}</strong> slots will be created<br /><span className="text-green-600">{days} days × {formData.time_slots.length} time slot{formData.time_slots.length > 1 ? 's' : ''}</span></>;
              })()}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>Create Slots</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SlotManagement;
