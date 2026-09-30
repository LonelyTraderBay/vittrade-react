import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

function EmailForm({ onSubmit }: { onSubmit: (values: { email: string }) => void }) {
  const methods = useForm<{ email: string }>({ defaultValues: { email: '' } });

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={methods.control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormDescription>Enter your email address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

describe('shared form primitives', () => {
  it('connects the label and description to the field and displays validation errors', async () => {
    const onSubmit = vi.fn();
    render(<EmailForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();

    fireEvent.submit(screen.getByRole('button', { name: 'Save' }).closest('form')!);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('form-item-message');

    fireEvent.change(input, { target: { value: 'trader@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save' }).closest('form')!);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: 'trader@example.com' }, expect.anything()),
    );
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });
});
