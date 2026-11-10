import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { useCallback, useState, type ReactNode } from 'react'
import { fetchMeetingTypes, type MeetingType } from '../../api/meetingTypes.ts'
import { LoadError, Loading } from '../../components/LoadStatus.tsx'
import { useLoad } from '../../useLoad.ts'
import MeetingTypeForm from './MeetingTypeForm.tsx'

function MeetingTypesTab() {
  const { state, retry, update } = useLoad(fetchMeetingTypes)
  const [formOpened, setFormOpened] = useState(false)

  const handleCreated = useCallback(
    (created: MeetingType) => update((types) => [...types, created]),
    [update],
  )

  let content: ReactNode
  if (state.status === 'loading') {
    content = <Loading />
  } else if (state.status === 'error') {
    content = <LoadError title="Не удалось загрузить типы встреч" onRetry={retry} />
  } else if (state.data.length === 0) {
    content = <Text c="dimmed">Пока нет типов встреч</Text>
  } else {
    content = (
      <Stack gap="sm">
        {state.data.map((type) => (
          <Card key={type.id} withBorder padding="md">
            <Text fw={600}>{type.name}</Text>
            {type.description && (
              <Text c="dimmed" size="sm">
                {type.description}
              </Text>
            )}
            <Text size="sm">{type.durationMinutes} мин</Text>
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button onClick={() => setFormOpened(true)}>Создать событие</Button>
      </Group>
      {content}
      <MeetingTypeForm
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        onCreated={handleCreated}
      />
    </Stack>
  )
}

export default MeetingTypesTab
