/** Alerta forte de novos pedidos, sintetizado localmente pelo Web Audio API. */
export class OrderAlert {
  private context: AudioContext | null = null

  isReady(): boolean {
    return this.context?.state === 'running'
  }

  async enable(): Promise<void> {
    const context = this.context ?? new AudioContext()
    this.context = context
    await context.resume()
    if (context.state !== 'running') throw new Error('O navegador bloqueou o áudio.')
  }

  play(): void {
    const context = this.context
    if (!context) return
    if (context.state === 'suspended') {
      void context.resume().then(() => { if (this.context === context && context.state === 'running') this.play() }).catch(() => {})
      return
    }
    if (context.state !== 'running') return

    const now = context.currentTime
    // Duas sequências de campainha, com ataque rápido e harmônicos.
    for (const [index, frequency] of [880, 740, 880, 740, 1046, 880].entries()) {
      const start = now + index * 0.2
      for (const [harmonic, gain] of [[1, 0.26], [2, 0.09]] as const) {
        const oscillator = context.createOscillator()
        const volume = context.createGain()
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(frequency * harmonic, start)
        volume.gain.setValueAtTime(0.0001, start)
        volume.gain.exponentialRampToValueAtTime(gain, start + 0.012)
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.17)
        oscillator.connect(volume)
        volume.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + 0.18)
      }
    }
  }

  close(): void {
    const current = this.context
    this.context = null
    if (current) void current.close()
  }
}

// Mantém o contexto de áudio entre mudanças de tela no painel administrativo.
export const orderAlert = new OrderAlert()
