import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

afterEach(() => vi.restoreAllMocks());

function EmailForm({
  onSubmit,
  required = 'Email is required',
}: {
  onSubmit: (values: { email: string }) => void;
  required?: string | boolean;
}) {
  const methods = useForm<{ email: string }>({ defaultValues: { email: '' } });

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={methods.control}
          name="email"
          rules={{ required }}
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
  it('keeps a server field error without a message accessible without inventing error text', async () => {
    function ServerErrorForm() {
      const methods = useForm({ defaultValues: { email: '' } });
      useEffect(() => {
        methods.setError('email', { type: 'server' });
      }, [methods]);
      return (
        <Form {...methods}>
          <FormField
            control={methods.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      );
    }
    render(<ServerErrorForm />);
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(document.querySelector('[data-slot="form-message"]')).not.toBeInTheDocument();
  });
  it('marks an invalid field without rendering an empty error message', async () => {
    render(<EmailForm onSubmit={vi.fn()} required />);
    fireEvent.submit(screen.getByRole('button', { name: 'Save' }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(document.querySelector('[data-slot="form-message"]')).not.toBeInTheDocument();
  });

  it.each([
    { missing: 'field', message: 'useFormField should be used within <FormField>' },
    { missing: 'item', message: 'useFormField should be used within <FormItem>' },
    { missing: 'form', message: 'useFormField should be used within <Form>' },
  ])('fails clearly when its $missing owner is absent', ({ missing, message }) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function BrokenForm() {
      const methods = useForm({ defaultValues: { email: '' } });
      const label = <FormLabel>Email</FormLabel>;
      if (missing === 'field')
        return (
          <Form {...methods}>
            <FormItem>{label}</FormItem>
          </Form>
        );
      const field = (
        <FormField
          control={methods.control}
          name="email"
          render={() => (missing === 'item' ? label : <FormItem>{label}</FormItem>)}
        />
      );
      return missing === 'form' ? field : <Form {...methods}>{field}</Form>;
    }
    expect(() => render(<BrokenForm />)).toThrow(message);
  });

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
