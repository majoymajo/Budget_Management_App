import { renderHook } from '@testing-library/react';
import { useAuthStatus } from '../useAuthStatus';
import { useUserStore } from '../../store/useUserStore';

// Mock the user store
jest.mock('../../store/useUserStore');

describe('useAuthStatus', () => {
  it('should return authentication status', () => {
    const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
    mockUseUserStore.mockImplementation((selector: any) => {
      const state = {
        isAuthenticated: true,
        isLoading: false,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useAuthStatus());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isChecking).toBe(false);
  });

  it('should return isChecking true when loading', () => {
    const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
    mockUseUserStore.mockImplementation((selector: any) => {
      const state = {
        isAuthenticated: false,
        isLoading: true,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useAuthStatus());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isChecking).toBe(true);
  });

  it('should return not authenticated when user is not logged in', () => {
    const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
    mockUseUserStore.mockImplementation((selector: any) => {
      const state = {
        isAuthenticated: false,
        isLoading: false,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useAuthStatus());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });
});
