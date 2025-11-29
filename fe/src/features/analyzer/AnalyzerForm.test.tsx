import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnalyzerForm } from './AnalyzerForm';
import { I18nProvider } from '../../shared/i18n';

const renderWithI18n = (ui: React.ReactNode) => render(<I18nProvider defaultLocale="cs">{ui}</I18nProvider>);

describe('AnalyzerForm', () => {
    it('renders correctly', () => {
        renderWithI18n(<AnalyzerForm onSubmit={() => { }} isLoading={false} />);
        expect(screen.getByLabelText(/Text lékaře/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Analyzovat text/i })).toBeInTheDocument();
    });

    it('disables button when input is empty', () => {
        renderWithI18n(<AnalyzerForm onSubmit={() => { }} isLoading={false} />);
        const button = screen.getByRole('button', { name: /Analyzovat text/i });
        expect(button).toBeDisabled();
    });

    it('enables button when input has text', () => {
        renderWithI18n(<AnalyzerForm onSubmit={() => { }} isLoading={false} />);
        const textarea = screen.getByLabelText(/Text lékaře/i);
        const button = screen.getByRole('button', { name: /Analyzovat text/i });

        fireEvent.change(textarea, { target: { value: 'Some text' } });
        expect(button).toBeEnabled();
    });

    it('calls onSubmit with text when submitted', async () => {
        const handleSubmit = vi.fn();
        renderWithI18n(<AnalyzerForm onSubmit={handleSubmit} isLoading={false} />);
        const textarea = screen.getByLabelText(/Text lékaře/i);
        const button = screen.getByRole('button', { name: /Analyzovat text/i });

        fireEvent.change(textarea, { target: { value: 'Patient has fever' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(handleSubmit).toHaveBeenCalledWith('Patient has fever');
        });
    });
});
