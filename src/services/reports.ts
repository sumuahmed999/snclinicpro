import api from './api';

export const reportService = {
  // Get pending payments report
  getPendingPaymentsReport: async (date: string, doctorId?: number): Promise<any> => {
    try {
      const params: any = { date };
      if (doctorId) params.doctor_id = doctorId;
      const response = await api.get('/reports/pending-payments', { params });
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get feedback report
  getFeedbackReport: async (date: string, doctorId?: number): Promise<any> => {
    try {
      const params: any = { date };
      if (doctorId) params.doctor_id = doctorId;
      const response = await api.get('/reports/feedback', { params });
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get patient visit report
  getPatientVisitReport: async (date: string, doctorId?: number): Promise<any> => {
    try {
      const params: any = { date };
      if (doctorId) params.doctor_id = doctorId;
      const response = await api.get('/reports/patient-visit', { params });
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get daily report data as JSON
  getDailyReport: async (date: string, doctorId?: number, monthly?: boolean): Promise<any> => {
    try {
      const params: any = { date };
      if (doctorId) params.doctor_id = doctorId;
      if (monthly) params.monthly = true;
      
      const response = await api.get(`/reports/daily`, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Get daily report error:', error);
      throw error;
    }
  },

  // Download daily report in Excel format
  downloadExcel: async (date: string, doctorId?: number, monthly?: boolean): Promise<Blob> => {
    try {
      const params: any = { date };
      if (doctorId) params.doctor_id = doctorId;
      if (monthly) params.monthly = true;
      
      const response = await api.get(`/reports/daily/excel`, {
        params,
        responseType: 'blob',
      });
      
      // Check if response is actually JSON error (when server returns 500)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.error?.message || 'Failed to generate report');
      }
      
      return response.data;
    } catch (error: any) {
      // If error response is a blob, try to parse it as JSON
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error?.message || 'Failed to generate report');
      }
      throw error;
    }
  },

  // Download daily report in PDF format
  downloadPdf: async (date: string): Promise<Blob> => {
    try {
      const response = await api.get(`/reports/daily/pdf`, {
        params: { date },
        responseType: 'blob',
      });
      
      // Check if response is actually JSON error (when server returns 500)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.error?.message || 'Failed to generate report');
      }
      
      return response.data;
    } catch (error: any) {
      // If error response is a blob, try to parse it as JSON
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error?.message || 'Failed to generate report');
      }
      throw error;
    }
  },

  // Download report by type with date range
  downloadReport: async (reportType: string, dateRange: { start_date: string; end_date: string }): Promise<void> => {
    try {
      // For now, all report types use the Excel endpoint with the start date
      // In the future, backend can be extended to support different report types
      const response = await api.get(`/reports/daily/excel`, {
        params: { date: dateRange.start_date },
        responseType: 'blob',
      });
      
      // Check if response is actually JSON error
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.error?.message || 'Failed to generate report');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // If error response is a blob, try to parse it as JSON
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error?.message || 'Failed to generate report');
      }
      throw error;
    }
  },
};
