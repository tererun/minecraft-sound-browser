import { List, type RowComponentProps } from 'react-window'
import AutoSizer from './AutoSizer'
import SoundItem from './SoundItem'
import { useAppStore, type SoundEventItem } from '../store/appStore'

const ROW_HEIGHT = 56
const VARIANT_HEIGHT = 44

interface RowProps {
  events: SoundEventItem[]
  expandedItems: Set<string>
}

function Row({ index, style, events }: RowComponentProps<RowProps>) {
  const event = events[index]
  return (
    <div style={style}>
      <SoundItem event={event} />
    </div>
  )
}

export default function SoundList() {
  const { filteredEvents, expandedItems } = useAppStore()

  const getRowHeight = (index: number) => {
    const event = filteredEvents[index]
    if (expandedItems.has(event.id)) {
      return ROW_HEIGHT + event.sounds.length * VARIANT_HEIGHT
    }
    return ROW_HEIGHT
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          style={{ height, width }}
          rowCount={filteredEvents.length}
          rowHeight={getRowHeight}
          overscanCount={10}
          rowComponent={Row}
          rowProps={{ events: filteredEvents, expandedItems }}
        />
      )}
    </AutoSizer>
  )
}
