import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyzerForm } from './AnalyzerForm';
import { describe, it, expect, vi } from 'vitest';

describe('AnalyzerForm', () => {
    it('renders correctly', () => {
        render(<AnalyzerForm onSubmit={() => { }} isLoading={false} />);
        expect(screen.getByLabelText(/Clinician Text/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Analyze Text/i })).toBeInTheDocument();
    });

    it('disables button when input is empty', () => {
        render(<AnalyzerForm onSubmit={() => { }} isLoading={false} />);
        const button = screen.getByRole('button', { name: /Analyze Text/i });
        expect(button).toBeDisabled();
    });

    it('enables button when input has text', () => {
        render(<AnalyzerForm onSubmit={() => { }} isLoading={false} />);
        const textarea = screen.getByLabelText(/Clinician Text/i);
        const button = screen.getByRole('button', { name: /Analyze Text/i });

        fireEvent.change(textarea, { target: { value: 'Some text' } });
        expect(button).toBeEnabled();
    });

    it('calls onSubmit with text when submitted', async () => {
        const handleSubmit = vi.fn();
        render(<AnalyzerForm onSubmit={handleSubmit} isLoading={false} />);
        const textarea = screen.getByLabelText(/Clinician Text/i);
        const button = screen.getByRole('button', { name: /Analyze Text/i });

        fireEvent.change(textarea, { target: { value: 'Patient has fever' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(handleSubmit).toHaveBeenCalledWith('Patient has fever');
        });
    });
});
