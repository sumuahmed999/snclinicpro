import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { appointmentService } from '../services/appointments';
import { Layout } from '../components/layout';
import { Loader, Button } from '../components/common';
import { AppointmentDetails } from '../components/patient/AppointmentDetails';

export const AppointmentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getAppointment(Number(id)),
    enabled: !!id,
  });

  const handleClose = () => {
    navigate('/appointments');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDownloadPDF = async () => {
    if (!data?.data) return;
    
    setIsDownloading(true);
    try {
      const appointment = data.data;
      
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Set up colors (as tuples for TypeScript)
      const primaryColor: [number, number, number] = [4, 33, 38]; // #042126
      const textColor: [number, number, number] = [51, 51, 51];
      const lightGray: [number, number, number] = [240, 240, 240];
      
      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ClinicPortal', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Appointment Details', 105, 30, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(...textColor);
      
      let yPos = 55;
      
      // Appointment Information Section
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPos, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Appointment Information', 20, yPos + 7);
      
      yPos += 15;
      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Token Number
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Token Number:', 20, yPos + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(appointment.token_number, 120, yPos + 6);
      yPos += 8;
      
      // Doctor
      doc.text('Doctor:', 20, yPos + 6);
      doc.text(`Dr. ${appointment.doctor?.name || 'N/A'}`, 120, yPos + 6);
      yPos += 8;
      
      // Specialization
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.text('Specialization:', 20, yPos + 6);
      doc.text(appointment.doctor?.specialization || 'N/A', 120, yPos + 6);
      yPos += 8;
      
      // Date
      doc.text('Date:', 20, yPos + 6);
      doc.text(appointment.slot ? formatDate(appointment.slot.date) : 'N/A', 120, yPos + 6);
      yPos += 8;
      
      // Time
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.text('Time:', 20, yPos + 6);
      doc.text(
        appointment.slot 
          ? `${formatTime(appointment.slot.start_time)} - ${formatTime(appointment.slot.end_time)}` 
          : 'N/A',
        120,
        yPos + 6
      );
      yPos += 8;
      
      // Status
      doc.text('Status:', 20, yPos + 6);
      doc.text(appointment.status.toUpperCase(), 120, yPos + 6);
      yPos += 8;
      
      // Family Member (if exists)
      if (appointment.family_member) {
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos, 180, 8, 'F');
        doc.text('Patient:', 20, yPos + 6);
        doc.text(
          `${appointment.family_member.name} (${appointment.family_member.relationship})`,
          120,
          yPos + 6
        );
        yPos += 8;
      }
      
      // Notes (if exists)
      if (appointment.notes) {
        doc.text('Notes:', 20, yPos + 6);
        const splitNotes = doc.splitTextToSize(appointment.notes, 70);
        doc.text(splitNotes, 120, yPos + 6);
        yPos += 8 * splitNotes.length;
      }
      
      yPos += 10;
      
      // Payment Information Section
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPos, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Information', 20, yPos + 7);
      
      yPos += 15;
      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Consultation Fee
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.text('Consultation Fee:', 20, yPos + 6);
      doc.text(`₹${appointment.doctor?.consultation_fee || 0}`, 120, yPos + 6);
      yPos += 8;
      
      // Payment Status
      doc.text('Payment Status:', 20, yPos + 6);
      doc.text(appointment.payment_status.toUpperCase(), 120, yPos + 6);
      yPos += 8;
      
      // Payment Method (if exists)
      if (appointment.payment?.payment_method) {
        doc.setFillColor(...lightGray);
        doc.rect(15, yPos, 180, 8, 'F');
        doc.text('Payment Method:', 20, yPos + 6);
        doc.text(appointment.payment.payment_method.toUpperCase(), 120, yPos + 6);
        yPos += 8;
      }
      
      // Transaction ID (if exists)
      if (appointment.payment?.transaction_id) {
        doc.text('Transaction ID:', 20, yPos + 6);
        doc.text(appointment.payment.transaction_id, 120, yPos + 6);
        yPos += 8;
      }
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      doc.text('ClinicPortal - Healthcare Excellence', 105, 285, { align: 'center' });
      doc.text('Powered by Softnetix', 105, 290, { align: 'center' });
      
      // Save the PDF
      doc.save(`appointment-${appointment.token_number}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex justify-center items-center min-h-screen">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !data?.data) {
    return (
      <Layout showSidebar={true}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card bg-red-50 border-red-200 p-6">
            <p className="text-red-800">Failed to load appointment details. Please try again.</p>
            <button
              onClick={handleClose}
              className="mt-4 text-red-600 hover:text-red-700 font-medium"
            >
              ← Back to Appointments
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={handleClose}
            className="flex items-center text-primary-500 hover:text-primary-600 font-medium mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Appointments
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary-500">
                Appointment Details
              </h1>
              <p className="text-sage-600 mt-2">
                View and manage your appointment information
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center space-x-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Appointment Details Card */}
        <div className="card p-6">
          <AppointmentDetails
            appointment={data.data}
            onClose={handleClose}
          />
        </div>
      </div>
    </Layout>
  );
};
