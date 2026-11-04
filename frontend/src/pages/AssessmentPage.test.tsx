import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AssessmentPage } from './AssessmentPage';

describe('AssessmentPage Component', () => {
  it('renders consent stage initially with Start button disabled', () => {
    render(<AssessmentPage />);
    const startBtn = screen.getByRole('button', { name: /start assessment/i });
    expect(startBtn).toBeDisabled();

    const checkbox = screen.getByLabelText(/i have read this and agree to take part/i);
    expect(checkbox).not.toBeChecked();

    // Ticking checkbox enables the button (when questionnaire is loaded)
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

