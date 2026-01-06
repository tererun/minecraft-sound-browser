import { useAppStore } from '../store/appStore'

const categoryLabels: Record<string, string> = {
  ambient: '環境音',
  block: 'ブロック',
  enchant: 'エンチャント',
  entity: 'エンティティ',
  event: 'イベント',
  item: 'アイテム',
  music: '音楽',
  music_disc: 'レコード',
  particle: 'パーティクル',
  ui: 'UI',
  weather: '天気'
}

export default function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory, soundEvents, filteredEvents } = useAppStore()

  const getCategoryCount = (category: string) => {
    return soundEvents.filter(e => e.category === category).length
  }

  return (
    <div className="p-3">
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        カテゴリ
      </h2>
      <ul className="space-y-1">
        <li>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <span>すべて</span>
            <span className="text-xs opacity-70">{soundEvents.length}</span>
          </button>
        </li>
        {categories.map(category => (
          <li key={category}>
            <button
              onClick={() => setSelectedCategory(category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <span>{categoryLabels[category] || category}</span>
              <span className="text-xs opacity-70">{getCategoryCount(category)}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t border-neutral-700">
        <p className="text-xs text-neutral-500">
          表示中: {filteredEvents.length} / {soundEvents.length}
        </p>
      </div>
    </div>
  )
}
