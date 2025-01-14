import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/shared/either'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { InvalidFileFormatError } from './errors/invalid-file-format'
import { uploadImage } from './upload-image'

describe('upload-image', () => {
  beforeAll(() => {
    vi.mock('@/infra/storage/upload-file-to-storage', () => {
      const fileName = `${randomUUID()}.jpg`
      return {
        uploadFileToStorage: vi.fn().mockImplementation(() => {
          return {
            key: fileName,
            url: `https://example.com/${fileName}`,
          }
        }),
      }
    })
  })

  it('should be able to upload an image', async () => {
    const fileName = `${randomUUID()}.jpg`

    const sut = await uploadImage({
      fileName,
      contentType: 'image/jpeg',
      contentStream: Readable.from([]),
    })

    expect(isRight(sut)).toBe(true)

    const result = await db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.name, fileName))

    expect(result).toHaveLength(1)
  })

  it('should be able to upload an invalid file', async () => {
    const fileName = `${randomUUID()}.pdf`

    const sut = await uploadImage({
      fileName,
      contentType: 'application/pdf',
      contentStream: Readable.from([]),
    })

    expect(isLeft(sut)).toBe(true)
    expect(unwrapEither(sut)).toBeInstanceOf(InvalidFileFormatError)
  })
})
