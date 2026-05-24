import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BookingConfirmation from '../BookingConfirmation'
import { useBookAppointment } from '../../../hooks/useAppointments'

// Mock the useBookAppointment hook
vi.mock('../../../hooks/useAppointments', () => ({
  useBookAppointment: vi.fn(),
}))

import type { Doctor, Slot } from '../../../types'

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

describe('Improved Error Handling for Rebooking', () => {
  const mockOnConfirm = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User-Friendly Error Messages', () => {
    it('should show improved message for duplicate booking errors', () => {
      const duplicateBookingError = {
        response: {
          data: {
            message: 'Duplicate booking detected',
            error: 'duplicate_booking'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: duplicateBookingError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('You already have an appointment for this slot. Please check your existing appointments or select a different time.')).toBeInTheDocument()
      expect(screen.getByText('Rebooking Help:')).toBeInTheDocument()
      expect(screen.getByText('Check your appointments to see if you have an existing booking')).toBeInTheDocument()
    })

    it('should show improved message for cancelled appointment rebooking errors', () => {
      const rebookingError = {
        response: {
          data: {
            message: 'Cannot rebook cancelled appointment',
            error: 'cancelled_appointment_rebooking'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: rebookingError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('This slot was previously cancelled by you. The system should allow rebooking - please try again or contact support if the issue persists.')).toBeInTheDocument()
      expect(screen.getByText('Rebooking Help:')).toBeInTheDocument()
      expect(screen.getByText('If you cancelled this slot before, the system should allow rebooking')).toBeInTheDocument()
    })

    it('should show improved message for slot full errors', () => {
      const slotFullError = {
        response: {
          data: {
            message: 'Slot is full',
            error: 'slot_full'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: slotFullError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('This slot is now full. Please refresh the page and select a different available time slot.')).toBeInTheDocument()
      expect(screen.getByText('What to do next:')).toBeInTheDocument()
      expect(screen.getByText('Go back and select a different time slot')).toBeInTheDocument()
    })

    it('should show improved message for slot unavailable errors', () => {
      const slotUnavailableError = {
        response: {
          data: {
            message: 'Slot no longer available',
            error: 'slot_unavailable'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: slotUnavailableError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('This slot is no longer available. Please go back and select a different time slot.')).toBeInTheDocument()
      expect(screen.getByText('What to do next:')).toBeInTheDocument()
      expect(screen.getByText('Check if there are other available dates')).toBeInTheDocument()
    })

    it('should show improved message for past slot errors', () => {
      const pastSlotError = {
        response: {
          data: {
            message: 'Cannot book past slot',
            error: 'past_slot'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: pastSlotError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('This slot is in the past and cannot be booked. Please select a future time slot.')).toBeInTheDocument()
    })

    it('should fall back to server message when available', () => {
      const customError = {
        response: {
          data: {
            message: 'Custom server error message',
            error: 'unknown_error'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: customError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Custom server error message')).toBeInTheDocument()
    })

    it('should show generic message for network errors', () => {
      const networkError = new Error('Network Error')

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: networkError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Unable to book appointment. The slot may be full or no longer available. Please try selecting a different time slot.')).toBeInTheDocument()
    })
  })

  describe('Contextual Help', () => {
    it('should provide rebooking help for duplicate booking scenarios', () => {
      const duplicateBookingError = {
        response: {
          data: {
            error: 'duplicate_booking'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: duplicateBookingError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Try refreshing the page and booking again')).toBeInTheDocument()
      expect(screen.getByText('Contact support if you continue to have issues')).toBeInTheDocument()
    })

    it('should provide slot selection help for availability issues', () => {
      const slotFullError = {
        response: {
          data: {
            error: 'slot_full'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: slotFullError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByText('Consider booking with a different doctor if urgent')).toBeInTheDocument()
    })

    it('should not show contextual help for other error types', () => {
      const genericError = {
        response: {
          data: {
            message: 'Generic error',
            error: 'generic_error'
          }
        }
      }

      ;(useBookAppointment as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: true,
        error: genericError,
      })

      renderWithQueryClient(
        <BookingConfirmation
          doctor={mockDoctor}
          slot={mockSlot}
          familyMember={null}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
        />
      )

      expect(screen.queryByText('Rebooking Help:')).not.toBeInTheDocument()
      expect(screen.queryByText('What to do next:')).not.toBeInTheDocument()
    })
  })
})