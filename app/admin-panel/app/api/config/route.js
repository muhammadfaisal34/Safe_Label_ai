export const dynamic = 'force-dynamic';

export async function GET() {
  const apiUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://safelabel-api-g6cnaah8ardsfpfs.uaenorth-01.azurewebsites.net';

  return Response.json({
    apiUrl: apiUrl.trim().replace(/\/$/, ''),
  });
}
