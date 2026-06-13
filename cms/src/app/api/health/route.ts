import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.find({
      collection: 'pages',
      limit: 1,
      depth: 0,
    })

    return NextResponse.json({
      ok: true,
      app: 'cms',
      timestamp: new Date().toISOString(),
      checks: {
        database: true,
        storage: Boolean(
          process.env.S3_BUCKET &&
            process.env.S3_ACCESS_KEY_ID &&
            process.env.S3_SECRET_ACCESS_KEY &&
            process.env.S3_ENDPOINT &&
            process.env.S3_PUBLIC_URL,
        ),
        resend: Boolean(process.env.RESEND_API_KEY),
        previewSecret: Boolean(process.env.PREVIEW_SECRET),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        app: 'cms',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
