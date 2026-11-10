import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

function HomePage() {
  return (
    <Center mih="70vh">
      <Stack align="center" gap="md">
        <Title order={1} ta="center">
          Календарь звонков
        </Title>
        <Text c="dimmed" ta="center" maw={480}>
          Сервис для бронирования звонков: выберите тип встречи и удобное время — без переписки и
          согласований
        </Text>
        <Button component={Link} to="/book" size="lg">
          Записаться
        </Button>
      </Stack>
    </Center>
  )
}

export default HomePage
