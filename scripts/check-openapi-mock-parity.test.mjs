import { describe, expect, it } from 'vitest';
import { checkParity } from './check-openapi-mock-parity.mjs';

function contract(path, method = 'get') {
  return {
    fileName: 'fixture.yaml',
    source: `openapi: 3.1.0\npaths:\n  ${path}:\n    ${method}:\n      operationId: fixtureOperation\n`,
  };
}

describe('OpenAPI and MSW method-path parity', () => {
  it('normalizes OpenAPI parameters and MSW origin wildcards', () => {
    const result = checkParity({
      contractSources: [contract('/widgets/{widgetId}')],
      handlerSource: "http.get('*/widgets/:widgetId', () => new Response())",
    });

    expect(result).toMatchObject({ contractCount: 1, mockCount: 1, passed: true });
  });

  it('reports missing and undeclared routes separately', () => {
    const result = checkParity({
      contractSources: [contract('/widgets', 'get')],
      handlerSource: "http.post('*/other', () => new Response())",
    });

    expect(result.passed).toBe(false);
    expect(result.missing).toEqual(['GET /widgets']);
    expect(result.extra).toEqual(['POST /other']);
  });

  it('rejects duplicate handlers even when the route set would otherwise match', () => {
    const result = checkParity({
      contractSources: [contract('/widgets')],
      handlerSource:
        "http.get('/widgets', () => new Response()); http.get('/widgets', () => new Response())",
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain(
      'line 1: duplicate MSW route GET /widgets (first declared on line 1)',
    );
  });

  it('rejects dynamic route arguments instead of silently skipping them', () => {
    const result = checkParity({
      contractSources: [contract('/widgets')],
      handlerSource: "const route = '/widgets'; http.get(route, () => new Response())",
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('line 1: http.get route must be a string literal');
  });

  it('rejects computed HTTP method calls', () => {
    const result = checkParity({
      contractSources: [contract('/widgets')],
      handlerSource: "http['get']('/widgets', () => new Response())",
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('line 1: computed http method is not supported');
  });
});
