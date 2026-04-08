import { useAuthStore } from '../../stores/auth.store'

export default function PointsCounter() {
  const points = useAuthStore((state) => state.user?.points ?? 0)

  return (
    <div className="absolute top-15 left-4 z-10 bg-white rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2">
      <span className="text-lg">🏆</span>
      <div>
        <p className="text-xs text-gray-400 leading-none mb-0.5">points</p>
        <p className="text-lg font-semibold text-gray-900 leading-none">{points}</p>
      </div>
    </div>
  )
}