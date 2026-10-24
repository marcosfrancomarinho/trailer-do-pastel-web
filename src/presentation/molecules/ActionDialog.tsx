import { useCallback, useEffect, useRef, useState } from 'react'

type Tone = 'warning' | 'success' | 'error' | 'info'
type DialogState = {
  title: string
  message: string
  tone: Tone
  confirmLabel: string
  confirmation: boolean
}

type DialogInput = {
  title: string
  message: string
  tone?: Tone
  confirmLabel?: string
}

function ActionDialog({
  state,
  onClose,
  onConfirm,
}: {
  state: DialogState
  onClose: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Avisos informativos desaparecem sozinhos; confirmações precisam da decisão do usuário.
  useEffect(() => {
    if (state.confirmation) return
    const timer = window.setTimeout(onClose, 4500)
    return () => window.clearTimeout(timer)
  }, [state.confirmation, onClose])

  const symbol = state.tone === 'success' ? '✓'
    : state.tone === 'error' ? '!'
      : state.tone === 'warning' ? '?' : 'i'

  return (
    <div
      className="action-dialog-backdrop"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        aria-describedby="action-dialog-description"
        className="action-dialog-panel"
      >
        <div className={'action-dialog-symbol action-dialog-' + state.tone} aria-hidden="true">
          {symbol}
        </div>
        <h2 id="action-dialog-title">{state.title}</h2>
        <p id="action-dialog-description">{state.message}</p>
        <div className="action-dialog-actions">
          {state.confirmation && (
            <button type="button" onClick={onClose} className="action-dialog-cancel" autoFocus>
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={'action-dialog-primary ' + (state.tone === 'warning' ? 'action-dialog-danger' : '')}
            autoFocus={!state.confirmation}
          >
            {state.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

/**
 * Confirmações e avisos padronizados.
 * Nunca executa uma ação destrutiva antes da confirmação do usuário.
 */
export function useActionDialog() {
  const [state, setState] = useState<DialogState | null>(null)
  const resolver = useRef<((answer: boolean) => void) | null>(null)

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed)
    resolver.current = null
    setState(null)
  }, [])

  useEffect(() => () => {
    resolver.current?.(false)
    resolver.current = null
  }, [])

  const confirm = useCallback((input: DialogInput): Promise<boolean> => {
    return new Promise(resolve => {
      resolver.current?.(false)
      resolver.current = resolve
      setState({
        title: input.title,
        message: input.message,
        tone: input.tone ?? 'warning',
        confirmLabel: input.confirmLabel ?? 'Confirmar',
        confirmation: true,
      })
    })
  }, [])

  const notify = useCallback((input: DialogInput) => {
    resolver.current?.(false)
    resolver.current = null
    setState({
      title: input.title,
      message: input.message,
      tone: input.tone ?? 'success',
      confirmLabel: input.confirmLabel ?? 'Entendi',
      confirmation: false,
    })
  }, [])

  return {
    confirm,
    notify,
    dialog: state ? (
      <ActionDialog
        state={state}
        onClose={() => close(false)}
        onConfirm={() => close(true)}
      />
    ) : null,
  }
}
