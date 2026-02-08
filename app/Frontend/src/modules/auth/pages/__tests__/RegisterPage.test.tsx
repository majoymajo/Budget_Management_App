import { render, screen } from '@testing-library/react';
import { RegisterPage } from '../RegisterPage';

// Mock the RegisterForm component
jest.mock('../../components/RegisterForm.tsx', () => ({
  RegisterForm: () => <div data-testid="register-form">Register Form</div>,
}));

describe('RegisterPage', () => {
  it('should render without crashing', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should render RegisterForm component', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Register Form')).toBeInTheDocument();
  });

  it('should have proper layout classes', () => {
    const { container } = render(<RegisterPage />);
    const wrapper = container.querySelector('.min-h-\\[calc\\(100vh-200px\\)\\]');
    expect(wrapper).toBeInTheDocument();
  });
});
