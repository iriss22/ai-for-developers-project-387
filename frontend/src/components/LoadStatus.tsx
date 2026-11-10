import { Alert, Button, Center, Loader } from '@mantine/core'

export function Loading() {
  return (
    <Center py="xl">
      <output aria-label="Загрузка">
        <Loader />
      </output>
    </Center>
  )
}

type LoadErrorProps = {
  title: string
  onRetry: () => void
}

export function LoadError({ title, onRetry }: LoadErrorProps) {
  return (
    <Alert color="red" title={title}>
      <Button variant="outline" color="red" size="xs" mt="sm" onClick={onRetry}>
        Повторить
      </Button>
    </Alert>
  )
}
