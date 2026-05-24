import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patients';
import type { User } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import { formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout';

const PatientManagement: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deactivateConfirmPatient, setDeactivateConfirmPatient] = useState<User | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({
        search: searchTerm || undefined,
        page: currentPage,
      });
      setPatients(response.data);
      setTotalPages(response.last_page);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (patientId: number) => {
    navigate(`/admin/patients/${patientId}`);
  };

  const handleDeactivatePatient = async (patient: User) => {
    try {
      await patientService.deactivatePatient(patient.id);
      fetchPatients();
      setDeactivateConfirmPatient(null);
    } catch (error) {
      console.error('Failed to deactivate patient:', error);
      alert('Failed to deactivate patient');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (loading && patients.length === 0) {
    return (
      <Layout showSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <Input
          type="text"
          placeholder="Search by name, email, or mobile..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          fullWidth
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
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
            {patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No patients found
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        {(patient as any).family_members_count > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs text-indigo-600 font-medium">
                              {(patient as any).family_members_count} family member{(patient as any).family_members_count > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(patient.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewPatient(patient.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Profile
                    </button>
                    {patient.is_active && (
                      <button
                        onClick={() => setDeactivateConfirmPatient(patient)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-6 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateConfirmPatient && (
        <Modal
          isOpen={true}
          onClose={() => setDeactivateConfirmPatient(null)}
          title="Confirm Deactivation"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to deactivate {deactivateConfirmPatient.name}'s account?
              They will no longer be able to log in or book appointments.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeactivateConfirmPatient(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeactivatePatient(deactivateConfirmPatient)}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </Layout>
  );
};

export default PatientManagement;
