import { useCallback, useState } from 'react'
import type { MapMouseEvent } from 'react-map-gl/mapbox'

import MapView from '../components/Map/MapView'
import IssueForm from '../components/Issues/IssueForm'
import IssueDetail from '../components/Issues/IssueDetail'
import ProfilePanel from '../components/User/ProfilePanel'
import UserHUD from '../components/User/UserHUD'
import XPBar from '../components/UI/XPBar'
import MapControls from '../components/Map/MapControls'

import { useAuthStore } from '../stores/auth.store'
import { useThemeStore } from '../stores/theme.store'
import { useDeviceFacing } from '../hooks/useDeviceFacing'
import { useIssues } from '../hooks/useIssues'
import { useNearbyIssues } from '../hooks/useNearbyIssues'
import { usePlayerLocation } from '../hooks/usePlayerLocation'
import { useNearbyPlayers } from '../hooks/useNearbyPlayers'
import { issuesApi } from '../api/issues.api'
import type { Issue } from '../api/issues.api'

import PlayerContextMenu from '../components/Map/PlayerContextMenu'
import type { Player } from '../api/users.api'

export default function DashboardPage() {
  const { userLocation, locationError } = usePlayerLocation()

  const [pendingPin, setPendingPin] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  const [showProfile, setShowProfile] = useState(false)
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined)

  const [contextPlayer, setContextPlayer] = useState<Player | null>(null)
  const [contextPosition, setContextPosition] = useState<{ x: number; y: number } | null>(null)

  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const mode = useThemeStore((state) => state.mode)
  
  const { issues, addIssue, mergeIssues, removeIssue } = useIssues()
  const { facing, requestPermission, permissionState } = useDeviceFacing()
  const { loading: loadingNearby, error: nearbyError, refresh } = useNearbyIssues(userLocation, mergeIssues, { radius: 1609 })
  const { players } = useNearbyPlayers(userLocation, { radius: 1609 })

  const mapStyle = mode === 'dark'
    ? 'mapbox://styles/mapbox/navigation-night-v1'
    : 'mapbox://styles/mapbox/standard'

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (selectedIssue) { setSelectedIssue(null); return }
    setPendingPin({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })
  }, [selectedIssue])

  const handleIssueClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
    setPendingPin(null)
  }, [])

  const handlePlayerClick = useCallback((player: Player, position: { x: number; y: number }) => {
    setSelectedIssue(null)
    setPendingPin(null)
    setContextPlayer(player)
    setContextPosition(position)
  }, [])

  const handleFormSubmit = useCallback(async (description: string, photo: File | null) => {
    if (!pendingPin || !user) return
    const { issue, newTotalPoints, newExperience, newLevel } = await issuesApi.create({
      description,
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      photo: photo ?? undefined,
    })
    addIssue(issue)
    setAuth(useAuthStore.getState().accessToken!, {
      ...user,
      points: newTotalPoints,
      experience: newExperience,
      level: newLevel,
    })
    setPendingPin(null)
  }, [pendingPin, user, addIssue, setAuth])

  const handleFormClose = useCallback(() => setPendingPin(null), [])
  const handleDetailClose = useCallback(() => setSelectedIssue(null), [])
  const handleBoundsChange = useCallback(() => {}, [])

  if (locationError) return (
    <div className="flex items-center justify-center h-screen text-red-500">
      <p>{locationError}</p>
    </div>
  )

  if (!userLocation) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Finding your location...</p>
      </div>
    </div>
  )

  return (
    <div className="relative w-screen h-screen">
      {/* Map fills the entire background */}
      <MapView
        mapStyle={mapStyle}
        userLocation={userLocation}
        facing={facing}
        players={players}
        issues={issues}
        selectedIssue={selectedIssue}
        pendingPin={pendingPin}
        onMapClick={handleMapClick}
        onIssueClick={handleIssueClick}
        onBoundsChange={handleBoundsChange}
        onPlayerClick={handlePlayerClick}
      />

      {/* UI overlays sit on top */}
      <UserHUD onOpenProfile={() => { setProfileUserId(undefined); setShowProfile(true) }} />
      <MapControls loading={loadingNearby} error={nearbyError} onRetry={refresh} />
      <XPBar />

      {permissionState === 'unknown' && (
        <button
          onClick={requestPermission}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl backdrop-blur-sm"
        >
          Enable Compass
        </button>
      )}

      {pendingPin && !selectedIssue && (
        <IssueForm onClose={handleFormClose} onSubmit={handleFormSubmit} />
      )}

      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          onClose={handleDetailClose}
          onDelete={async (id) => {
            await issuesApi.delete(id)
            removeIssue(id)
            setSelectedIssue(null)
          }}
        />
      )}

      {contextPlayer && contextPosition && (
        <PlayerContextMenu
          username={contextPlayer.username}
          position={contextPosition}
          onClose={() => { setContextPlayer(null); setContextPosition(null) }}
          onViewProfile={() => {
            setProfileUserId(contextPlayer.id)
            setShowProfile(true)
            setContextPlayer(null)
            setContextPosition(null)
          }}
        />
      )}

      {showProfile && (
        <ProfilePanel
          userId={profileUserId}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  )
}