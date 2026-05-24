import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppointmentDetails } from '../AppointmentDetails'
import { useCancelAppointment } from '../../../hooks/useAppointments'

// Mock the hooks and services
vi.mock('../../../hooks/useAppointments', () => ({
  useCancelAppointment: vi.fn(),
}))

vi.mock('../../../services/medicalRecords', () => ({
  medicalRecordService: {
    getRecords: vi.fn().mockResolvedValue({ data: [] }),
    downloadRecord: vi.fn(),
  },
}))

vi.mock('../../../services/feedback', () => ({
  feedbackService: {
    submitFeedback: vi.fn(),
  },
}))

vi.mock('../../../services/payments', () => ({
  paymentService: {
    downloadInvoice: vi.fn(),
  },
}))

import type { Appointment } from '../../../types'

const mockAppointment = {
  id: 1,
  status: 'confirmed',
  payment_status: 'paid',
  token_number: 'T001',
  notes: 'Regular checkup',
  doctor: {
    id: 1,
    name: 'Dr. Smith',
    specialization: 'Cardiology',
    consultation_fee: 500,
  },
  slot: {
    id: 1,
    date: '2024-01-15',
    start_time: '10:00:00',
    end_time: '10:30:00',
  },
  family_member: {
    id: 1,
    name: 'John Doe',
    relationship: 'Son',
  },
  payment: {
    payment_method: 'online',
  },
} as Appointment

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Appointment Cancellation and Rebooking Error Handling', () => {
  const mockOnClose = vi.fn()
  let mockMutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync = vi.fn()
    
    // Default mock implementation
    ;(useCancelAppointment as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    })
  })

  describe('Cancellation Flow', () => {
    it('should show cancel button for confirmed appointments', () => {
      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Cancel Appointment')).toBeInTheDocument()
    })

    it('should not show cancel button for cancelled appointments', () => {
      const cancelledAppointment = { ...mockAppointment, status: 'cancelled' } as Appointment

      renderWithQueryClient(
        <AppointmentDetails
          appointment={cancelledAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Cancel Appointment')).not.toBeInTheDocument()
    })

    it('should not show cancel button for completed appointments', () => {
      const completedAppointment = { ...mockAppointment, status: 'completed' } as Appointment

      renderWithQueryClient(
        <AppointmentDetails
          appointment={completedAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Cancel Appointment')).not.toBeInTheDocument()
    })

    it('should show cancellation form when cancel button is clicked', () => {
      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByText('Cancel Appointment')
      fireEvent.click(cancelButton)

      expect(screen.getByText('Reason for cancellation (optional)')).toBeInTheDocument()
      expect(screen.getByText('Confirm Cancel')).toBeInTheDocument()
      expect(screen.getByText('Keep Appointment')).toBeInTheDocument()
    })

    it('should handle successful cancellation', async () => {
      mockMutateAsync.mockResolvedValue({ data: { ...mockAppointment, status: 'cancelled' } })

      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByText('Cancel Appointment')
      fireEvent.click(cancelButton)

      const reasonTextarea = screen.getByPlaceholderText('Please provide a reason...')
      fireEvent.change(reasonTextarea, { target: { value: 'Schedule conflict' } })

      const confirmCancelButton = screen.getByText('Confirm Cancel')
      fireEvent.click(confirmCancelButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: mockAppointment.id,
          data: { reason: 'Schedule conflict' },
        })
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should handle cancellation errors gracefully', async () => {
      const cancellationError = new Error('Cancellation failed')
      mockMutateAsync.mockRejectedValue(cancellationError)

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByText('Cancel Appointment')
      fireEvent.click(cancelButton)

      const confirmCancelButton = screen.getByText('Confirm Cancel')
      fireEvent.click(confirmCancelButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to cancel appointment:', cancellationError)
      })

      consoleSpy.mockRestore()
    })

    it('should show loading state during cancellation', () => {
      ;(useCancelAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      })

      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByText('Cancel Appointment')
      fireEvent.click(cancelButton)

      expect(screen.getByText('Cancelling...')).toBeInTheDocument()
      
      const confirmCancelButton = screen.getByText('Cancelling...')
      expect(confirmCancelButton).toBeDisabled()
    })

    it('should allow cancellation without reason', async () => {
      mockMutateAsync.mockResolvedValue({ data: { ...mockAppointment, status: 'cancelled' } })

      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByText('Cancel Appointment')
      fireEvent.click(cancelButton)

      const confirmCancelButton = screen.getByText('Confirm Cancel')
      fireEvent.click(confirmCancelButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: mockAppointment.id,
          data: { reason: '' },
        })
      })
    })

    it('should allow user to keep appointment', () => {
      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByText('Cancel Appointment')
      fireEvent.click(cancelButton)

      const keepButton = screen.getByText('Keep Appointment')
      fireEvent.click(keepButton)

      expect(screen.queryByText('Reason for cancellation (optional)')).not.toBeInTheDocument()
      expect(screen.getByText('Cancel Appointment')).toBeInTheDocument()
    })
  })

  describe('Appointment Status Display', () => {
    it('should display appointment information correctly', () => {
      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      expect(screen.getByText('Cardiology')).toBeInTheDocument()
      expect(screen.getByText('T001')).toBeInTheDocument()
      expect(screen.getByText('confirmed', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Regular checkup')).toBeInTheDocument()
    })

    it('should display payment information correctly', () => {
      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('₹500')).toBeInTheDocument()
      expect(screen.getByText('paid', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('online', { exact: false })).toBeInTheDocument()
    })

    it('should show download invoice button for paid appointments', () => {
      renderWithQueryClient(
        <AppointmentDetails
          appointment={mockAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Download Invoice')).toBeInTheDocument()
    })

    it('should not show download invoice button for unpaid appointments', () => {
      const unpaidAppointment = { ...mockAppointment, payment_status: 'pending' } as Appointment

      renderWithQueryClient(
        <AppointmentDetails
          appointment={unpaidAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Download Invoice')).not.toBeInTheDocument()
    })
  })

  describe('Rebooking Context', () => {
    it('should display cancelled appointment status clearly', () => {
      const cancelledAppointment = { ...mockAppointment, status: 'cancelled' } as Appointment

      renderWithQueryClient(
        <AppointmentDetails
          appointment={cancelledAppointment}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('cancelled', { exact: false })).toBeInTheDocument()
    })

    it('should show appointment details for cancelled appointments to help with rebooking', () => {
      const cancelledAppointment = { ...mockAppointment, status: 'cancelled' } as Appointment

      renderWithQueryClient(
        <AppointmentDetails
          appointment={cancelledAppointment}
          onClose={mockOnClose}
        />
      )

      // User should still see all the appointment details to help with rebooking
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      expect(screen.getByText('Cardiology')).toBeInTheDocument()
      expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('10:00 AM')).toBeInTheDocument()
    })
  })
})