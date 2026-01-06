import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface SoundVariant {
  name: string
  hash: string
  absolutePath: string
}

export interface SoundEventItem {
  id: string
  displayName: string
  category: string
  sounds: SoundVariant[]
}

interface AssetIndex {
  objects: Record<string, { hash: string; size: number }>
}

interface SoundsJson {
  [eventId: string]: {
    sounds: (string | { name: string; volume?: number; pitch?: number })[]
    category?: string
  }
}

interface LanguageJson {
  [key: string]: string
}

export async function indexSoundData(settings: {
  assetIndexPath: string
  objectsDir: string
  soundsJsonPath: string
  languageJsonPath: string
}): Promise<SoundEventItem[]> {
  const { assetIndexPath, objectsDir, soundsJsonPath, languageJsonPath } = settings

  if (!existsSync(assetIndexPath) || !existsSync(soundsJsonPath)) {
    throw new Error('Required files not found')
  }

  const assetIndex: AssetIndex = JSON.parse(readFileSync(assetIndexPath, 'utf-8'))
  const soundsJson: SoundsJson = JSON.parse(readFileSync(soundsJsonPath, 'utf-8'))

  let languageJson: LanguageJson = {}
  if (existsSync(languageJsonPath)) {
    languageJson = JSON.parse(readFileSync(languageJsonPath, 'utf-8'))
  }

  const soundEvents: SoundEventItem[] = []

  for (const [eventId, eventData] of Object.entries(soundsJson)) {
    const category = extractCategory(eventId)
    const displayName = resolveDisplayName(eventId, languageJson)

    const sounds: SoundVariant[] = []

    for (const sound of eventData.sounds) {
      const soundName = typeof sound === 'string' ? sound : sound.name

      const assetPath = `minecraft/sounds/${soundName}.ogg`
      const assetEntry = assetIndex.objects[assetPath]

      if (assetEntry) {
        const hash = assetEntry.hash
        const hashPrefix = hash.substring(0, 2)
        const absolutePath = join(objectsDir, hashPrefix, hash)

        if (existsSync(absolutePath)) {
          const variantName = soundName.split('/').pop() || soundName
          sounds.push({
            name: variantName,
            hash,
            absolutePath
          })
        }
      }
    }

    if (sounds.length > 0) {
      soundEvents.push({
        id: eventId,
        displayName,
        category,
        sounds
      })
    }
  }

  return soundEvents.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
}

function extractCategory(eventId: string): string {
  const parts = eventId.split('.')
  return parts[0] || 'unknown'
}

function resolveDisplayName(eventId: string, languageJson: LanguageJson): string {
  const parts = eventId.split('.')

  const searchPatterns = generateSearchPatterns(parts, eventId)

  for (const pattern of searchPatterns) {
    if (languageJson[pattern]) {
      const action = extractAction(eventId)
      const baseName = languageJson[pattern]
      return action ? `${baseName} (${action})` : baseName
    }
  }

  return formatEventIdAsDisplay(eventId)
}

function generateSearchPatterns(parts: string[], eventId: string): string[] {
  const patterns: string[] = []

  if (parts.length >= 2) {
    const category = parts[0]
    const blockOrEntity = parts.slice(1, -1).join('_')

    if (category === 'block' || category === 'entity' || category === 'item') {
      patterns.push(`${category}.minecraft.${blockOrEntity}`)
      patterns.push(`${category}.minecraft.${blockOrEntity.replace(/_/g, '')}`)

      if (blockOrEntity.includes('_')) {
        const simplified = blockOrEntity.split('_')[0]
        patterns.push(`${category}.minecraft.${simplified}`)
      }

      patterns.push(`${category}.minecraft.${parts[1]}`)
    }

    if (category === 'ambient' || category === 'music' || category === 'weather') {
      patterns.push(`subtitles.${eventId}`)
    }
  }

  patterns.push(`subtitles.${parts.join('.')}`)

  return patterns
}

function extractAction(eventId: string): string {
  const parts = eventId.split('.')
  const lastPart = parts[parts.length - 1]

  const actionMap: Record<string, string> = {
    break: '破壊',
    place: '設置',
    step: '足音',
    hit: 'ヒット',
    fall: '落下',
    ambient: '環境音',
    hurt: 'ダメージ',
    death: '死亡',
    attack: '攻撃',
    eat: '食べる',
    drink: '飲む',
    idle: '待機',
    say: '鳴き声'
  }

  return actionMap[lastPart] || ''
}

function formatEventIdAsDisplay(eventId: string): string {
  return eventId
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
