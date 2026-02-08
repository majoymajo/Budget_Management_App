import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DynamicBreadcrumbs } from '../DynamicBreadcrumbs';

// Mock the breadcrumb components
jest.mock('../../../../components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  BreadcrumbList: ({ children }: { children: React.ReactNode }) => <ol>{children}</ol>,
  BreadcrumbItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  BreadcrumbLink: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <span>{children}</span>
  ),
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  BreadcrumbSeparator: () => <span>/</span>,
}));

describe('DynamicBreadcrumbs', () => {
  it('should render home breadcrumb for root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <DynamicBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('should render breadcrumbs for transactions page', () => {
    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <DynamicBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Transacciones')).toBeInTheDocument();
  });

  it('should render breadcrumbs for reports page', () => {
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <DynamicBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Reportes')).toBeInTheDocument();
  });

  it('should capitalize unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/custom-page']}>
        <DynamicBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom page')).toBeInTheDocument();
  });

  it('should handle nested routes', () => {
    render(
      <MemoryRouter initialEntries={['/transactions/new']}>
        <DynamicBreadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Transacciones')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});
