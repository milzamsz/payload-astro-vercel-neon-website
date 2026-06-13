import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Categories } from './collections/Categories'

import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { SiteSettings } from './globals/SiteSettings'
import { EmailSettings } from './globals/EmailSettings'

import { plugins } from './plugins'
import { getAllowedOrigins, getServerURL } from './utilities/getURL'
import { createPayloadEmailAdapter } from './utilities/resendEmailAdapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const sharpLib = await (async () => {
  try {
    return (await import('sharp')).default
  } catch (error) {
    console.warn('[payload] sharp unavailable; continuing without image processing support', error)
    return undefined
  }
})()

export default buildConfig({
  admin: {
    user: Users.slug,
    suppressHydrationWarning: true,
    components: {
      graphics: {
        Logo: './components/payload/AdminLogo#AdminLogo',
      },
      providers: ['./components/payload/TwoFactorProvider#TwoFactorProvider'],
      views: {
        twoFactorVerify: {
          Component: './components/payload/TwoFactorAdminPage#TwoFactorAdminPage',
          path: '/2fa',
        },
        twoFactorSetup: {
          Component: './components/payload/TwoFactorSetupPage#TwoFactorSetupPage',
          path: '/2fa-setup',
        },
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  collections: [Users, Media, Pages, Posts, Categories],

  globals: [Header, Footer, SiteSettings, EmailSettings],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      // Neon requires SSL. rejectUnauthorized:false tolerates the pooled cert chain.
      ssl: { rejectUnauthorized: false },
    },
    push: false,
  }),

  editor: lexicalEditor(),

  email: createPayloadEmailAdapter(),

  plugins: [
    ...plugins,
    s3Storage({
      collections: {
        media: {
          disablePayloadAccessControl: true,
          prefix: 'uploads',
          generateFileURL: ({ filename: file, prefix }) => {
            const base = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')
            const key = [prefix, file].filter(Boolean).join('/')
            return base ? `${base}/${key}` : `/${key}`
          },
        },
      },
      bucket: process.env.S3_BUCKET!,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'auto',
        forcePathStyle: true,
      },
    }),
  ],

  cors: getAllowedOrigins(),
  csrf: getAllowedOrigins(),

  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-change-in-production',

  ...(sharpLib ? { sharp: sharpLib } : {}),

  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  serverURL: getServerURL(),

  upload: { limits: { fileSize: 10_000_000 } },
})
