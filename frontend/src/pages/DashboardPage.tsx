import { useCallback, useEffect, useState } from 'react'
import type { MapMouseEvent } from 'react-map-gl/mapbox'

import MapView from '../components/Map/MapView'
import IssueForm from '../components/Issues/IssueForm'
import IssueDetail from '../components/Issues/IssueDetail'
import ProfilePanel from '../components/User/ProfilePanel'
import UserHUD from '../components/User/UserHUD'
import XPBar from '../components/UI/XPBar'
import MapControls from '../components/Map/MapControls'
import PlayerContextMenu from '../components/Map/PlayerContextMenu'
import FriendsPanel from '../components/User/FriendsPanel'

import { useAuthStore } from '../stores/auth.store'
import { useDeviceFacing } from '../hooks/device/useDeviceFacing'
import { useIssues } from '../hooks/issues/useIssues'
import { useNearbyIssues } from '../hooks/issues/useNearbyIssues'
import { usePlayerLocation } from '../hooks/users/usePlayerLocation'
import { useNearbyPlayers } from '../hooks/users/useNearbyPlayers'
import { useIssueSocket } from '../hooks/issues/socket/useIssueSocket'
import { useLocationSocket } from '../hooks/users/socket/useLocationSocket'
import { useFriendSocket } from '../hooks/friendship/socket/useFriendSocket'

import { useFriends } from '../hooks/friendship/useFriends'
import { useFriendRequests } from '../hooks/friendship/useFriendRequests'
import { disconnectSocket } from '../lib/socket'
import { issuesApi } from '../api/issues.api'
import type { Issue } from '../api/issues.api'
import type { Player } from '../api/users.api'

export default function DashboardPage() {
  const { userLocation, locationError } = usePlayerLocation()

  const [pendingPin, setPendingPin] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined)
  const [contextPlayer, setContextPlayer] = useState<Player | null>(null)
  const [contextPosition, setContextPosition] = useState<{ x: number; y: number } | null>(null)
  const [showFriends, setShowFriends] = useState(false)

  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)

  const { issues, addIssue, mergeIssues, updateIssueStatus, removeIssue } = useIssues()
  const { facing, requestPermission, permissionState } = useDeviceFacing()
  const { loading: loadingNearby, error: nearbyError, refresh } = useNearbyIssues(userLocation, mergeIssues, { radius: 1609 })
  const { players } = useNearbyPlayers(userLocation, { radius: 1609 })
  const {
    friends,
    loading: friendsLoading,
    addFriend,
    removeFriend: removeFriendFromList,
  } = useFriends()

  const {
    requests: friendRequests,
    sentRequests,
    loading: requestsLoading,
    addRequest,
    addSentRequest,
    removeSentRequest,
    acceptRequest,
    declineRequest,
  } = useFriendRequests()

  // Socket - real time friendship events
  useFriendSocket({
    onRequestReceived: addRequest,
    onRequestAccepted: (friend) => {
      addFriend(friend)
      removeSentRequest(friend.id)
    },
    onFriendRemoved: removeFriendFromList,
  })

  // Socket — real time issue events
  useIssueSocket({
    onNewIssue: addIssue,
    onStatusChanged: updateIssueStatus,
    onDeleted: removeIssue,
  })

  // Socket — push our location to nearby players
  useLocationSocket(userLocation)

  // Disconnect cleanly when leaving the dashboard
  useEffect(() => {
    return () => disconnectSocket()
  }, [])

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

  const handleAcceptRequest = useCallback(async (userId: string) => {
    await acceptRequest(userId)
    // Find the request to build a provisional Friend entry
    const req = friendRequests.find((r) => r.sender_id === userId)
    if (req) {
      addFriend({
        id: req.sender_id,
        username: req.username,
        avatar_url: req.avatar_url,
        level: req.level,
        points: 0,
        presence: "online",
        last_seen: new Date().toISOString(),
      })
    }
  }, [acceptRequest, friendRequests, addFriend])

  const handleFormSubmit = useCallback(async (description: string, photo: File) => {
    if (!pendingPin || !user) return
    const { issue, newTotalPoints, newExperience, newLevel } = await issuesApi.create({
      description,
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      photo,
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
      <MapView
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

      <UserHUD
        onOpenProfile={() => { setProfileUserId(undefined); setShowProfile(true) }}
        onOpenFriends={() => setShowFriends(true)}
      />
      <MapControls loading={loadingNearby} error={nearbyError} onRetry={refresh} />
      <XPBar />

      {permissionState !== 'granted' && permissionState !== 'unavailable' && (
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
          userLocation={userLocation}
          onClose={handleDetailClose}
          onDelete={async (id) => {
            await issuesApi.delete(id)
            removeIssue(id)
            setSelectedIssue(null)
          }}
          onClaim={async (id, latitude, longitude) => {
            await issuesApi.claim(id, latitude, longitude)
            updateIssueStatus(id, 'claimed')
          }}
          onResolve={async (id, afterPhoto, latitude, longitude) => {
            await issuesApi.resolve(id, { latitude, longitude, afterPhoto })
            updateIssueStatus(id, 'resolved')
            setSelectedIssue(null)
          }}
        />
      )}

      {contextPlayer && contextPosition && (
        <PlayerContextMenu
          username={contextPlayer.username}
          userId={contextPlayer.id}
          position={contextPosition}
          friends={friends}
          friendRequests={friendRequests}
          onSentRequest={addSentRequest}
          sentRequests={sentRequests}
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
          friends={friends}
          friendRequests={friendRequests}
          sentRequests={sentRequests}
          onSentRequest={addSentRequest}
        />
      )}

      {showFriends && (
        <FriendsPanel
          onClose={() => setShowFriends(false)}
          onViewProfile={(userId) => {
            setProfileUserId(userId)
            setShowProfile(true)
            setShowFriends(false)
          }}
          friends={friends}
          friendsLoading={friendsLoading}
          requests={friendRequests}
          requestsLoading={requestsLoading}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={declineRequest}
        />
      )}
    </div>
  )
}