import { routes } from './app.routes';
import { francophoneAdminGuard } from '../features/packs/presentation/guards/francophone-admin.guard';

describe('app.routes', () => {
  it('should define the correct number of active routes', () => {
    expect(routes.length).toBe(7);
  });

  it('should load the landing page on root path', () => {
    const route = routes.find((r) => r.path === '');
    expect(route).toBeDefined();
    expect(route!.pathMatch).toBe('full');
    expect(route!.loadComponent).toBeDefined();
  });

  it('should redirect packs path to /packs/francophone', () => {
    const route = routes.find((r) => r.path === 'packs');
    expect(route).toBeDefined();
    expect(route!.pathMatch).toBe('full');
    expect(route!.redirectTo).toBe('packs/francophone');
  });

  it('should have the francophone pack route', () => {
    const route = routes.find((r) => r.path === 'packs/francophone');
    expect(route).toBeDefined();
    expect(route!.loadComponent).toBeDefined();
  });

  it('should have the francophone request route', () => {
    const route = routes.find((r) => r.path === 'packs/francophone/request');
    expect(route).toBeDefined();
    expect(route!.loadComponent).toBeDefined();
  });

  it('should protect the admin requests route with francophoneAdminGuard', () => {
    const route = routes.find((r) => r.path === 'packs/francophone/admin/requests');
    expect(route).toBeDefined();
    expect(route!.canMatch).toContain(francophoneAdminGuard);
  });

  it('should have a legal CGU route', () => {
    const route = routes.find((r) => r.path === 'legal/cgu');
    expect(route).toBeDefined();
    expect(route!.loadComponent).toBeDefined();
  });

  it('should redirect unknown paths to root', () => {
    const route = routes.find((r) => r.path === '**');
    expect(route).toBeDefined();
    expect(route!.redirectTo).toBe('/');
  });
});
