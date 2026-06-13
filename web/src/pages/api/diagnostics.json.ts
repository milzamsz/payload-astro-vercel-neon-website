import { getCmsHealth } from '@/lib/data'

export const GET = async () => {
  if (import.meta.env.ENABLE_DIAGNOSTICS !== 'true') {
    return new Response(JSON.stringify({ ok: false, message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const cms = await getCmsHealth()

  return new Response(
    JSON.stringify(
      {
        ok: true,
        app: 'web',
        mode: 'ssr',
        timestamp: new Date().toISOString(),
        env: {
          cmsConfigured: Boolean(import.meta.env.PUBLIC_CMS_URL),
          previewSecretConfigured: Boolean(import.meta.env.PREVIEW_SECRET),
        },
        cms,
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
