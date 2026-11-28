import { isAxiosError } from 'axios';

export const financialCurrencies = ['USD', 'GHS', 'CAD', 'EUR', 'GBP', 'AUD', 'NZD', 'CHF', 'JPY'] as const;

export function financeErrorMessage(error: unknown): string {
  if (isAxiosError<{ error?: string; errors?: { msg: string }[] }>(error)) {
    if (error.response?.data?.errors?.length) return error.response.data.errors.map(item => item.msg).join('; ');
    if (error.response?.data?.error) return error.response.data.error;
  }
  return error instanceof Error ? error.message : 'Request failed. Please retry.';
}
