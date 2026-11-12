/**
 * API Documentation Route
 * Serves OpenAPI/Swagger documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/swagger';

// GET /api/docs - Get OpenAPI specification
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  // Return JSON spec for API clients
  if (url.searchParams.get('format') === 'json') {
    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // Return Swagger UI HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Groway Merchant OS API Documentation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 2em; }
    .swagger-ui .info .title small { font-size: 0.5em; }
    /* Custom branding */
    .swagger-ui .information-container { background: #f0fdfa; padding: 20px; }
    .swagger-ui .scheme-container { background: #f0fdfa; }
    .swagger-ui .btn.authorize { background-color: #00897B; border-color: #00897B; }
    .swagger-ui .btn.authorize:hover { background-color: #00695C; }
    .swagger-ui .opblock-tag { border-bottom: 2px solid #00897B; }
    .swagger-ui .opblock .opblock-summary-method { background: #00897B; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #4CAF50; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #00897B; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #FF9800; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f44336; }
    .swagger-ui .tab li.active { background: #00897B; color: white; }
    .swagger-ui .model-box { background: #f5f5f5; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "${url.pathname}?format=json",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        syntaxHighlight: {
          activate: true,
          theme: "monokai"
        },
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        persistAuthorization: true,
      });
      window.ui = ui;
    }
  </script>
</body>
</html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
