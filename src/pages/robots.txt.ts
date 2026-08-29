export async function GET() {
  return new Response(
    `User-agent: *
Allow: /

# Block admin/private areas (future-proofing)
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://energiatotal.cu/sitemap-index.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}