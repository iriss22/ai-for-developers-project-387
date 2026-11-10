import { Alert, Button, Group, Modal, Radio, Stack, Textarea, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client.ts'
import { createMeetingType, type MeetingType } from '../../api/meetingTypes.ts'
import type { MeetingDuration } from '../../api/generated/types.gen.ts'
import { unshownFieldErrors } from '../../formErrors.ts'

type MeetingTypeFormProps = {
  opened: boolean
  onClose: () => void
  onCreated: (type: MeetingType) => void
}

const DEFAULT_DURATION = '30'
const FORM_FIELDS = ['name', 'description', 'durationMinutes'] as const

function MeetingTypeForm({ opened, onClose, onCreated }: MeetingTypeFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState(false)

  const reset = () => {
    setName('')
    setDescription('')
    setDuration(DEFAULT_DURATION)
    setErrors({})
    setSubmitError(false)
  }

  const generalErrors = unshownFieldErrors(errors, FORM_FIELDS)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setErrors({})
    setSubmitError(false)
    createMeetingType({
      name,
      description: description || undefined,
      durationMinutes: Number(duration) as MeetingDuration,
    })
      .then((created) => {
        reset()
        onCreated(created)
        onClose()
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 400) {
          setErrors(error.fieldErrors)
        } else {
          setSubmitError(true)
        }
      })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Новый тип встречи">
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Название"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            error={errors.name}
          />
          <Textarea
            label="Описание"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            error={errors.description}
          />
          <Radio.Group
            label="Длительность"
            value={duration}
            onChange={setDuration}
            error={errors.durationMinutes}
          >
            <Group mt="xs">
              <Radio value="15" label="15 минут" />
              <Radio value="30" label="30 минут" />
              <Radio value="60" label="60 минут" />
            </Group>
          </Radio.Group>
          {(submitError || generalErrors.length > 0) && (
            <Alert color="red" title="Не удалось сохранить тип встреч">
              {generalErrors.join(' ')}
            </Alert>
          )}
          <Button type="submit">Сохранить</Button>
        </Stack>
      </form>
    </Modal>
  )
}

export default MeetingTypeForm
