import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BookingConfirmation from '../BookingConfirmation'
import { useBookAppointment } from '../../../hooks/useAppointments'

// Mock the useBookAppointment hook
vi.mock('../../../hooks/useAppointments', () => ({
  useBookAppointment: vi.fn(),
}))

import type { Doctor, Slot, FamilyMember } from '../../../types'

const mockDoctor = {
  id: 1,
  name: 'Dr. Smith',
  specialization: 'Cardiology',
  consultation_fee: 500,
} as Doctor

const mockSlot = {
  id: 1,
  date: '2024-01-15',
  start_time: '10:00:00',
  end_time: '10:30:00',
  max_capacity: 5,
  available_capacity: 3,
} as Slot

const mockFamilyMember = {
  id: 1,
  name: 'John Doe',
  relationship: 'Son',
} as FamilyMember

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

describe('Booking Error Handling', () => {
  const mockOnConfirm = vi.fn()
  const mockOnBack = vi.fn()
  let mockMutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync = vi.fn()
    
    // Default mock implementation
    ;(useBookAppointment as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    })
  })

  describe('Duplicate Booking Error Handling', () => {
    it('should display user-friendly error message for duplicate booking', async () => {
      const duplicateBookingError = {
        response: {
          data: {
            message: 'You already have an appointment for this slot',
            error: 'duplicate_booking'
          }
        }
      }

      mockMutateAsync.mockRejectedValue(duplicateBookingError)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: duplicateBookingError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Booking Failed')).toBeInTheDocument()
      expect(screen.getByText('You already have an appointment for this slot. Please check your existing appointments or select a different time.')).toBeInTheDocument()
    })

    it('should handle cancelled appointment rebooking scenario', async () => {
      // First simulate a cancelled appointment rebooking attempt
      const rebookingError = {
        response: {
          data: {
            message: 'Cannot book: You have a cancelled appointment for this slot',
            error: 'cancelled_appointment_rebooking'
          }
        }
      }

      mockMutateAsync.mockRejectedValue(rebookingError)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: rebookingError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Booking Failed')).toBeInTheDocument()
      expect(screen.getByText('This slot was previously cancelled by you. The system should allow rebooking - please try again or contact support if the issue persists.')).toBeInTheDocument()
    })
  })

  describe('Slot Availability Error Handling', () => {
    it('should display appropriate error when slot is full', async () => {
      const slotFullError = {
        response: {
          data: {
            message: 'This slot is now full',
            error: 'slot_full'
          }
        }
      }

      mockMutateAsync.mockRejectedValue(slotFullError)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: slotFullError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Booking Failed')).toBeInTheDocument()
      expect(screen.getByText('This slot is now full. Please refresh the page and select a different available time slot.')).toBeInTheDocument()
    })

    it('should display appropriate error when slot is no longer available', async () => {
      const slotUnavailableError = {
        response: {
          data: {
            message: 'This slot is no longer available',
            error: 'slot_unavailable'
          }
        }
      }

      mockMutateAsync.mockRejectedValue(slotUnavailableError)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: slotUnavailableError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Booking Failed')).toBeInTheDocument()
      expect(screen.getByText('This slot is no longer available. Please go back and select a different time slot.')).toBeInTheDocument()
    })
  })

  describe('Network and Server Error Handling', () => {
    it('should display generic error message for network errors', async () => {
      const networkError = new Error('Network Error')

      mockMutateAsync.mockRejectedValue(networkError)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: networkError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Booking Failed')).toBeInTheDocument()
      expect(screen.getByText('Unable to book appointment. The slot may be full or no longer available. Please try selecting a different time slot.')).toBeInTheDocument()
    })

    it('should display server error message when available', async () => {
      const serverError = {
        response: {
          data: {
            message: 'Internal server error occurred',
            error: 'server_error'
          }
        }
      }

      mockMutateAsync.mockRejectedValue(serverError)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: serverError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Booking Failed')).toBeInTheDocument()
      expect(screen.getByText('Internal server error occurred')).toBeInTheDocument()
    })
  })

  describe('Successful Booking Flow', () => {
    it('should proceed to payment when booking succeeds', async () => {
      const successResponse = {
        data: {
          id: 123,
          status: 'confirmed',
          token_number: 'T001'
        }
      }

      mockMutateAsync.mockResolvedValue(successResponse)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      const confirmButton = screen.getByText('Confirm & Proceed to Payment')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          slot_id: mockSlot.id,
          family_member_id: mockFamilyMember.id,
          notes: undefined,
        })
      })

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(123)
      })
    })

    it('should handle booking with notes', async () => {
      const successResponse = {
        data: {
          id: 123,
          status: 'confirmed',
          token_number: 'T001'
        }
      }

      mockMutateAsync.mockResolvedValue(successResponse)
      
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      const notesTextarea = screen.getByPlaceholderText('Any specific concerns or information for the doctor...')
      fireEvent.change(notesTextarea, { target: { value: 'Follow-up appointment' } })

      const confirmButton = screen.getByText('Confirm & Proceed to Payment')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          slot_id: mockSlot.id,
          family_member_id: mockFamilyMember.id,
          notes: 'Follow-up appointment',
        })
      })
    })
  })

  describe('Loading States', () => {
    it('should disable buttons and show loading state during booking', () => {
      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={mockFamilyMember}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      const backButton = screen.getByRole('button', { name: /back/i })

      expect(confirmButton).toBeDisabled()
      expect(backButton).toBeDisabled()
    })
  })
})