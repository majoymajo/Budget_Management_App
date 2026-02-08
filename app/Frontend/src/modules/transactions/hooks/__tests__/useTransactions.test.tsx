import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactions } from '../useTransactions';
import * as transactionService from '../../services/transactionService';
import { toast } from 'sonner';

// Mock the transaction service
jest.mock('../../services/transactionService');
jest.mock('sonner');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch transactions successfully', async () => {
    const mockTransactions = [
      { id: 1, amount: 100, description: 'Test' },
      { id: 2, amount: 200, description: 'Test 2' },
    ];

    (transactionService.getTransactionItems as jest.Mock).mockResolvedValue(mockTransactions);

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.error).toBeNull();
  });

  it('should handle error when fetching transactions', async () => {
    const error = new Error('Failed to fetch');
    (transactionService.getTransactionItems as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000, interval: 100 }
    );

    // After loading is done, check for error
    expect(result.current.error).not.toBeNull();
  });

  it('should create transaction successfully', async () => {
    const mockTransactions = [];
    (transactionService.getTransactionItems as jest.Mock).mockResolvedValue(mockTransactions);
    (transactionService.createTransaction as jest.Mock).mockResolvedValue({ id: 3 });

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newTransaction = {
      amount: 300,
      description: 'New transaction',
      type: 'EXPENSE' as const,
      category: 'Food',
      date: new Date('2024-01-01'),
    };

    result.current.createTransaction(newTransaction);

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });

    expect(transactionService.createTransaction).toHaveBeenCalledWith(newTransaction);
  });

  it('should filter transactions by period', async () => {
    const mockTransactions = [{ id: 1, amount: 100 }];
    (transactionService.getTransactionItems as jest.Mock).mockResolvedValue(mockTransactions);

    const period = '2024-01';
    renderHook(() => useTransactions(period), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(transactionService.getTransactionItems).toHaveBeenCalledWith(period);
    });
  });
});
