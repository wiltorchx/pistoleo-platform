import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    serviceWorker: {
      register: vi.fn().mockResolvedValue({}),
    },
    mediaDevices: {
      getUserMedia: vi.fn().mockRejectedValue(new Error('Not available in test')),
    },
  },
});

HTMLCanvasElement.prototype.getContext = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  useParams: () => ({ id: 'test-id' }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', firstName: 'Test', role: 'admin' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    fetchUser: vi.fn(),
  }),
}));