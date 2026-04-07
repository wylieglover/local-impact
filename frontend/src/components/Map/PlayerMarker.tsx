export default function PlayerMarker() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse ring */}
      <div className="absolute w-12 h-12 rounded-full bg-blue-400 opacity-20 animate-ping" />
      <div className="absolute w-8 h-8 rounded-full bg-blue-400 opacity-30" />

      {/* Person silhouette */}
      <div className="relative z-10 w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M12 13c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z" />
        </svg>
      </div>
    </div>
  )
}