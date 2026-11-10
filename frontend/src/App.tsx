import { Anchor, AppShell, Button, Group } from '@mantine/core'
import { Link, Route, Routes, useLocation } from 'react-router'
import HomePage from './pages/HomePage.tsx'
import BookPage from './pages/BookPage.tsx'
import AdminPage from './pages/AdminPage.tsx'

function App() {
  // Каждый переход на /book (в том числе по «Записаться» со страницы записи) даёт новый
  // location.key: мастер записи монтируется заново и начинается с выбора типа события
  const location = useLocation()

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Anchor component={Link} to="/" c="inherit" fw={700} underline="never">
            Календарь звонков
          </Anchor>
          <Group gap="sm">
            <Button component={Link} to="/admin" variant="subtle">
              Админка
            </Button>
            <Button component={Link} to="/book">
              Записаться
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage key={location.key} />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
