/**
 * ══════════════════════════════════════════════════════════════
 *  CopyEducationPage.test.tsx — Education Module Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (8 tests):
 * 1. ✅ All 4 modules render
 * 2. ✅ Progress tracking works
 * 3. ✅ Mandatory checkpoint enforced
 * 4. ✅ Quiz questions work
 * 5. ✅ Can complete education
 * 6. ✅ Completion certificate shown
 * 7. ✅ Cannot skip modules
 * 8. ✅ Stores completion status
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { CopyEducationPage } from '../CopyEducationPage';

describe('CopyEducationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear completion status
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  });

  it('should render all 4 education modules', () => {
    renderWithRouter(<CopyEducationPage />);

    // Module 1: What is Copy Trading?
    expect(screen.getByText(/what is copy trading/i)).toBeInTheDocument();

    // Module 2: Risks & Rewards
    expect(screen.getByText(/risks.*rewards/i)).toBeInTheDocument();

    // Module 3: How to Choose Providers
    expect(screen.getByText(/how to choose providers/i)).toBeInTheDocument();

    // Module 4: Risk Management
    expect(screen.getByText(/risk management/i)).toBeInTheDocument();
  });

  it('should track progress through modules', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    // Initial progress should be 0%
    expect(screen.getByText(/0%.*complete/i)).toBeInTheDocument();

    // Complete Module 1
    const module1 = screen.getByText(/what is copy trading/i).closest('div');
    const completeBtn1 = within(module1!).getByRole('button', { name: /complete/i });
    await user.click(completeBtn1);

    // Progress should update to 25%
    await waitFor(() => {
      expect(screen.getByText(/25%.*complete/i)).toBeInTheDocument();
    });

    // Module 1 should show checkmark
    const checkmark = within(module1!).getByTestId('check-icon');
    expect(checkmark).toBeInTheDocument();
  });

  it('should enforce mandatory checkpoint at Module 2', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    // Try to skip to Module 3 without completing 1 & 2
    const module3 = screen.getByText(/how to choose providers/i).closest('div');
    const startBtn3 = within(module3!).getByRole('button', { name: /start/i });

    // Should be disabled
    expect(startBtn3).toBeDisabled();

    // Tooltip should explain why
    await user.hover(startBtn3);
    await waitFor(() => {
      expect(screen.getByText(/complete previous modules first/i)).toBeInTheDocument();
    });
  });

  it('should have working quiz questions', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    // Start Module 1
    const module1 = screen.getByText(/what is copy trading/i).closest('div');
    const startBtn = within(module1!).getByRole('button', { name: /start/i });
    await user.click(startBtn);

    // Should show quiz after content
    await waitFor(() => {
      expect(screen.getByText(/quiz/i)).toBeInTheDocument();
    });

    // Question 1
    expect(screen.getByText(/what does copy trading mean/i)).toBeInTheDocument();

    // Answer options
    const correctAnswer = screen.getByRole('radio', { name: /automatically replicate/i });
    const wrongAnswer = screen.getByRole('radio', { name: /copy-paste strategies/i });

    expect(correctAnswer).toBeInTheDocument();
    expect(wrongAnswer).toBeInTheDocument();

    // Select correct answer
    await user.click(correctAnswer);

    // Submit quiz
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    await user.click(submitBtn);

    // Should show correct feedback
    await waitFor(() => {
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  it('should allow completing all education modules', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    // Complete all 4 modules sequentially
    for (let i = 1; i <= 4; i++) {
      const moduleText = [
        /what is copy trading/i,
        /risks.*rewards/i,
        /how to choose providers/i,
        /risk management/i,
      ][i - 1];

      const module = screen.getByText(moduleText).closest('div');
      const actionBtn = within(module!).getByRole('button', { name: /(start|complete)/i });
      
      await user.click(actionBtn);

      // Wait for module to mark as complete
      await waitFor(() => {
        const progress = (i / 4) * 100;
        expect(screen.getByText(new RegExp(`${progress}%.*complete`, 'i'))).toBeInTheDocument();
      });
    }

    // Final progress should be 100%
    expect(screen.getByText(/100%.*complete/i)).toBeInTheDocument();
  });

  it('should show completion certificate when finished', async () => {
    const user = userEvent.setup();
    
    // Mock completed state
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({
        module1: true,
        module2: true,
        module3: true,
        module4: true,
        completedAt: new Date().toISOString(),
      })
    );

    renderWithRouter(<CopyEducationPage />);

    // Should show certificate
    expect(screen.getByText(/certificate of completion/i)).toBeInTheDocument();
    expect(screen.getByText(/you have successfully completed/i)).toBeInTheDocument();

    // Should show completion date
    expect(screen.getByText(/completed on/i)).toBeInTheDocument();

    // Should have download/share buttons
    expect(screen.getByRole('button', { name: /download certificate/i })).toBeInTheDocument();

    // Should have CTA to start copying
    const startCopyingBtn = screen.getByRole('button', { name: /start copying/i });
    expect(startCopyingBtn).toBeInTheDocument();

    await user.click(startCopyingBtn);

    // Should navigate to provider list
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trade/copy-trading')
      );
    });
  });

  it('should prevent skipping modules', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    // Module 2 should be locked until Module 1 is complete
    const module2 = screen.getByText(/risks.*rewards/i).closest('div');
    const startBtn2 = within(module2!).getByRole('button', { name: /start/i });

    expect(startBtn2).toBeDisabled();

    // Lock icon should be visible
    const lockIcon = within(module2!).getByTestId('lock-icon');
    expect(lockIcon).toBeInTheDocument();

    // Complete Module 1
    const module1 = screen.getByText(/what is copy trading/i).closest('div');
    const completeBtn1 = within(module1!).getByRole('button', { name: /complete/i });
    await user.click(completeBtn1);

    // Module 2 should now be unlocked
    await waitFor(() => {
      expect(startBtn2).not.toBeDisabled();
    });

    // Lock icon should be replaced with unlock icon
    const unlockIcon = within(module2!).queryByTestId('lock-icon');
    expect(unlockIcon).not.toBeInTheDocument();
  });

  it('should store completion status in localStorage', async () => {
    const user = userEvent.setup();
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithRouter(<CopyEducationPage />);

    // Complete Module 1
    const module1 = screen.getByText(/what is copy trading/i).closest('div');
    const completeBtn = within(module1!).getByRole('button', { name: /complete/i });
    await user.click(completeBtn);

    // Should save to localStorage
    await waitFor(() => {
      expect(localStorageSpy).toHaveBeenCalledWith(
        expect.stringContaining('copyEducation'),
        expect.stringContaining('module1')
      );
    });

    // On reload, should restore progress
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({ module1: true })
    );

    // Re-render
    renderWithRouter(<CopyEducationPage />);

    // Module 1 should show as complete
    const reloadedModule1 = screen.getByText(/what is copy trading/i).closest('div');
    const checkmark = within(reloadedModule1!).getByTestId('check-icon');
    expect(checkmark).toBeInTheDocument();

    // Progress should be 25%
    expect(screen.getByText(/25%.*complete/i)).toBeInTheDocument();
  });
});
