type Props = { message: string };

export default function CartToast({ message }: Props) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-atomic='true'
      className='fixed bottom-24 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[#6caa82] bg-[#153f2e] px-5 py-4 text-center text-sm font-extrabold text-white shadow-2xl sm:bottom-6'
    >
      ✓ {message}
    </div>
  );
}
