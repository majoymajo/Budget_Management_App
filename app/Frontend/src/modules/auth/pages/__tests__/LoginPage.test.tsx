import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';

// Mock the LoginForm component
jest.mock('../../components/LoginForm.tsx', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

describe('LoginPage', () => {
  it('should render without crashing', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should render LoginForm component', () => {
    render(<LoginPage />);
    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  it('should have proper layout classes', () => {
    const { container } = render(<LoginPage />);
    const wrapper = container.querySelector('.min-h-\\[calc\\(100vh-200px\\)\\]');
    expect(wrapper).toBeInTheDocument();
  });
});
