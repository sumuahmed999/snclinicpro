import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SlotSelection from '../SlotSelection'
import { slotService } from '../../../services/slots'

// Mock the slot service
vi.mock('../../../services/slots', () => ({
  slotService: {
    getDoctorSlots: vi.fn(),
  },
}))

import type { Doctor } from '../../../types'

const mockDoctor = {
  id: 1,
  name: 'Dr. Smith',
  specialization: 'Cardiology',
  consultation_fee: 500,
} as Doctor

const mockSlots = [
  {
    id: 1,
    date: '2024-01-15',
    start_time: '10:00:00',
    end_time: '10:30:00',
    max_capacity: 5,
    available_capacity: 3,
    is_past: false,
    is_full: false,
  },
  {
    id: 2,
    date: '2024-01-15',
    start_time: '11:00:00',
    end_time: '11:30:00',
    max_capacity: 5,
    available_capacity: 0,
    is_past: false,
    is_full: true,
  },
  {
    id: 3,
    date: '2024-01-15',
    start_time: '09:00:00',
    end_time: '09:30:00',
    max_capacity: 5,
    available_capacity: 0,
    is_past: true,
    is_full: false,
  },
]

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

describe('Slot Selection Error Handling', () => {
  const mockOnSelect = vi.fn()
  const mockOnBack = vi.fn()
  const mockDate = '2024-01-15'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Slot Loading States', () => {
    it('should show loading spinner while fetching slots', () => {
      // Mock pending state
      ;(slotService.getDoctorSlots as any).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to simulate loading
      )

      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      expect(screen.getByRole('status')).toBeInTheDocument() // Loader component
    })

    it('should display error message when slot loading fails', async () => {
      const errorMessage = 'Failed to load slots'
      ;(slotService.getDoctorSlots as any).mockRejectedValue(new Error(errorMessage))

      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load slots. Please try again.')).toBeInTheDocument()
      })

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should allow retry when slot loading fails', async () => {
      ;(slotService.getDoctorSlots as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockSlots })

      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load slots. Please try again.')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('10:00 AM - 10:30 AM')).toBeInTheDocument()
      })
    })
  })

  describe('Slot Availability Display', () => {
    beforeEach(() => {
      ;(slotService.getDoctorSlots as any).mockResolvedValue({ data: mockSlots })
    })

    it('should display available slots correctly', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM - 10:30 AM')).toBeInTheDocument()
      })

      expect(screen.getByText('3 available')).toBeInTheDocument()
    })

    it('should display full slots as disabled', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('11:00 AM - 11:30 AM')).toBeInTheDocument()
      })

      const fullSlotButton = screen.getByText('11:00 AM - 11:30 AM').closest('button')
      expect(fullSlotButton).toBeDisabled()
      expect(screen.getByText('Full')).toBeInTheDocument()
    })

    it('should display past slots as disabled', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('9:00 AM - 9:30 AM')).toBeInTheDocument()
      })

      const pastSlotButton = screen.getByText('9:00 AM - 9:30 AM').closest('button')
      expect(pastSlotButton).toBeDisabled()
      expect(screen.getByText('Past')).toBeInTheDocument()
    })

    it('should show warning for slots with low availability', async () => {
      const lowAvailabilitySlots = [
        {
          ...mockSlots[0],
          available_capacity: 2,
        }
      ]

      ;(slotService.getDoctorSlots as any).mockResolvedValue({ data: lowAvailabilitySlots })

      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 left')).toBeInTheDocument()
      })
    })
  })

  describe('Slot Selection Interaction', () => {
    beforeEach(() => {
      ;(slotService.getDoctorSlots as any).mockResolvedValue({ data: mockSlots })
    })

    it('should allow selection of available slots', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM - 10:30 AM')).toBeInTheDocument()
      })

      const availableSlotButton = screen.getByText('10:00 AM - 10:30 AM').closest('button')
      fireEvent.click(availableSlotButton!)

      const continueButton = screen.getByText('Continue')
      expect(continueButton).not.toBeDisabled()

      fireEvent.click(continueButton)
      expect(mockOnSelect).toHaveBeenCalledWith(mockSlots[0])
    })

    it('should prevent selection of disabled slots', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('11:00 AM - 11:30 AM')).toBeInTheDocument()
      })

      const fullSlotButton = screen.getByText('11:00 AM - 11:30 AM').closest('button')
      fireEvent.click(fullSlotButton!)

      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeDisabled()
    })

    it('should handle empty slots gracefully', async () => {
      ;(slotService.getDoctorSlots as any).mockResolvedValue({ data: [] })

      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No slots available for this date.')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-refresh Functionality', () => {
    beforeEach(() => {
      ;(slotService.getDoctorSlots as any).mockResolvedValue({ data: mockSlots })
    })

    it('should display auto-refresh indicator', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Availability updates automatically every 30 seconds')).toBeInTheDocument()
      })

      expect(screen.getByText('Refresh Now')).toBeInTheDocument()
    })

    it('should allow manual refresh', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Refresh Now')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('Refresh Now')
      fireEvent.click(refreshButton)

      // Verify the service was called again
      expect(slotService.getDoctorSlots).toHaveBeenCalledTimes(2)
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      ;(slotService.getDoctorSlots as any).mockResolvedValue({ data: mockSlots })
    })

    it('should handle back navigation', async () => {
      renderWithQueryClient(
        <SlotSelection
          doctor={mockDoctor}
          date={mockDate}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })

      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)

      expect(mockOnBack).toHaveBeenCalled()
    })
  })
})