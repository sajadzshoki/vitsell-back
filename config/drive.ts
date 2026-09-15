import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'
import type { InferDriveDisks } from '@adonisjs/drive/types'

/**
 * Drive — local fs (CI/fallback) + S3-compatible MinIO (default).
 * Bucket: S3_BUCKET (vitsell). MinIO needs forcePathStyle + endpoint.
 */
const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    fs: services.fs({
      location: app.makePath('storage/uploads'),
      visibility: 'public',
      serveFiles: false,
      appUrl: env.get('APP_URL'),
    }),

    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID') || 'vitsell',
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY') || 'vitsellsecret',
      },
      region: env.get('AWS_REGION') || 'ir-thr-1',
      bucket: env.get('S3_BUCKET') || 'vitsell',
      endpoint: env.get('S3_ENDPOINT'),
      forcePathStyle: true,
      // MinIO: prefer bucket policy over object ACL
      supportsACL: false,
      visibility: 'public',
      cdnUrl: env.get('S3_PUBLIC_URL') || undefined,
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
