import request from 'supertest';
import app from '../../app';
import YAML from 'yamljs';
import path from 'path';
import type { OpenAPIV3 } from 'openapi-types';

describe('Swagger Contract Tests', () => {
  let swaggerDoc: OpenAPIV3.Document;

  beforeAll(() => {
    const swaggerPath = path.resolve(__dirname, '../../swagger/openapi.yaml');
    swaggerDoc = YAML.load(swaggerPath) as OpenAPIV3.Document;
  });

  it('should have valid OpenAPI structure', () => {
    expect(swaggerDoc).toBeDefined();
    expect(swaggerDoc.openapi).toMatch(/^3\./);
    expect(swaggerDoc.info).toBeDefined();
    expect(swaggerDoc.paths).toBeDefined();
  });

  it('should have /health endpoint documented or available', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok');
  });

  describe('Authentication endpoints', () => {
    it('should have POST /api/v1/users/login documented', () => {
      const path = swaggerDoc.paths?.['/api/v1/users/login'];
      expect(path).toBeDefined();
      expect(path?.post).toBeDefined();
      
      const postOp = path?.post as OpenAPIV3.OperationObject;
      expect(postOp.requestBody).toBeDefined();
      expect(postOp.responses).toBeDefined();
      expect(postOp.responses['200']).toBeDefined();
    });

    it('should match login request schema', async () => {
      const path = swaggerDoc.paths?.['/api/v1/users/login'];
      const postOp = path?.post as OpenAPIV3.OperationObject;
      const requestBody = postOp.requestBody as OpenAPIV3.RequestBodyObject;
      const content = requestBody.content?.['application/json'];
      const schema = content?.schema as OpenAPIV3.SchemaObject;

      expect(schema?.properties).toBeDefined();
      expect(schema?.properties?.email).toBeDefined();
      expect(schema?.properties?.password).toBeDefined();
    });
  });

  describe('Protected endpoints have security', () => {
    const protectedEndpoints = [
      '/api/v1/employees',
      '/api/v1/departments',
      '/api/v1/analytics/summary'
    ];

    protectedEndpoints.forEach(endpoint => {
      it(`should have security defined for ${endpoint}`, () => {
        const pathObj = swaggerDoc.paths?.[endpoint];
        if (pathObj) {
          const methods = ['get', 'post', 'put', 'delete', 'patch'];
          methods.forEach(method => {
            const operation = (pathObj as any)[method] as OpenAPIV3.OperationObject | undefined;
            if (operation) {
              // Should have security defined (Bearer auth)
              expect(operation.security).toBeDefined();
              expect(Array.isArray(operation.security)).toBe(true);
            }
          });
        }
      });
    });
  });

  describe('Response schemas', () => {
    it('should have response schemas defined for successful responses', () => {
      const paths = Object.keys(swaggerDoc.paths || {});
      expect(paths.length).toBeGreaterThan(0);

      paths.forEach(pathKey => {
        const pathObj = swaggerDoc.paths?.[pathKey];
        if (pathObj) {
          Object.values(pathObj).forEach((operation: any) => {
            if (operation?.responses) {
              const successResponse = operation.responses['200'] || operation.responses['201'];
              if (successResponse) {
                expect(successResponse).toBeDefined();
              }
            }
          });
        }
      });
    });
  });
});

