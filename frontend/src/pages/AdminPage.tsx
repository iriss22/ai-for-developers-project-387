import { Container, Tabs, Title } from '@mantine/core'
import MeetingTypesTab from './admin/MeetingTypesTab.tsx'
import UpcomingBookingsTab from './admin/UpcomingBookingsTab.tsx'

function AdminPage() {
  return (
    <Container size="md" py="xl">
      <Title order={2}>Админка</Title>
      <Tabs defaultValue="meeting-types" mt="md">
        <Tabs.List>
          <Tabs.Tab value="meeting-types">Типы встреч</Tabs.Tab>
          <Tabs.Tab value="upcoming">Предстоящие встречи</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="meeting-types" pt="md">
          <MeetingTypesTab />
        </Tabs.Panel>
        <Tabs.Panel value="upcoming" pt="md">
          <UpcomingBookingsTab />
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}

export default AdminPage
