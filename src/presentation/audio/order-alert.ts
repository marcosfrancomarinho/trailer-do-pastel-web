/** Toque curto gerado no próprio navegador, sem arquivos de áudio externos. */
export class OrderAlert {
  private context: AudioContext | null = null

  async enable(): Promise<void> {
    const context = this.context ?? new AudioContext()
    this.context = context
    await context.resume()
    if (context.state !== 'running') throw new Error('O navegador bloqueou o áudio.')
  }

  play(): void {
    const context = this.context
    if (!context || context.state !== 'running') return

    const now = context.currentTime
    for (const [index, frequency] of [660, 880, 1046].entries()) {
      const start = now + index * 0.16
      const oscillator = context.createOscillator()
      const volume = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, start)
      volume.gain.setValueAtTime(0.0001, start)
      volume.gain.exponentialRampToValueAtTime(0.2, start + 0.018)
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.14)
      oscillator.connect(volume)
      volume.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.15)
    }
  }

  close(): void {
    const current = this.context
    this.context = null
    if (current) void current.close()
  }
}
