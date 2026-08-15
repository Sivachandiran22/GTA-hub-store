import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Fetch the target model from server-side to bypass CORS blocks
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return new Response(`Failed to fetch model: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'model/gltf-binary';
    
    // Stream response body directly to the client with open CORS access and caching
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('Model proxy error:', error);
    return new Response(`Internal server error: ${error.message}`, { status: 500 });
  }
}
