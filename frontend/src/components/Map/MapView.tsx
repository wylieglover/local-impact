import { useCallback, useEffect, useState } from 'react'
import Map, { Marker, NavigationControl, AttributionControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import IssueForm from '../Issues/IssueForm'
import IssueDetail from '../Issues/IssueDetail'
import PointsCounter from '../UI/PointsCounter'
import PlayerMarker from './PlayerMarker'
import IssueMarker from './IssueMarker'
import MapControls from './MapControls'
import { useAuthStore } from '../../stores/auth.store'
import { useIssues } from '../../hooks/useIssues'
import { useNearbyIssues } from '../../hooks/useNearbyIssues'
import { issuesApi } from '../../api/issues.api'
import type { Issue } from '../../api/issues.api'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

type UserLocation = {
  latitude: number
  longitude: number
}

export default function MapView() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [pendingPin, setPendingPin] = useState<UserLocation | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const { issues, addIssue, mergeIssues } = useIssues()

  const { loading: loadingNearby, error: nearbyError, refresh } = useNearbyIssues(
    userLocation,
    mergeIssues,
    { radius: 1609 }
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => setLocationError('Unable to retrieve your location'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (selectedIssue) {
      setSelectedIssue(null)
      return
    }
    setPendingPin({
      latitude: e.lngLat.lat,
      longitude: e.lngLat.lng,
    })
  }, [selectedIssue])

  const handleFormSubmit = useCallback(async (
    description: string,
    photo: File | null
  ) => {
    if (!pendingPin || !user) return

    const { issue, newTotalPoints } = await issuesApi.create({
      description,
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      photo: photo ?? undefined,
    })

    addIssue(issue)

    setAuth(
      useAuthStore.getState().accessToken!,
      { ...user, points: newTotalPoints }
    )

    setPendingPin(null)
  }, [pendingPin, user, addIssue, setAuth])

  const handleFormClose = useCallback(() => setPendingPin(null), [])
  const handleDetailClose = useCallback(() => setSelectedIssue(null), [])

  if (locationError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>{locationError}</p>
      </div>
    )
  }

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Finding your location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      <PointsCounter />
      <MapControls
        loading={loadingNearby}
        error={nearbyError}
        onRetry={refresh}
      />

      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          zoom: 15,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={handleMapClick}
        cursor={pendingPin ? 'default' : 'crosshair'}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Compact attribution — required by Mapbox ToS */}
        <AttributionControl
          position="bottom-right"
          compact={true}
        />

        {/* Player location */}
        <Marker
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          anchor="center"
        >
          <PlayerMarker />
        </Marker>

        {/* Pending pin */}
        {pendingPin && (
          <Marker
            latitude={pendingPin.latitude}
            longitude={pendingPin.longitude}
            anchor="bottom"
          >
            <div className="text-2xl animate-bounce">📍</div>
          </Marker>
        )}

        {/* Issues */}
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            latitude={issue.latitude}
            longitude={issue.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedIssue(issue)
              setPendingPin(null)
            }}
          >
            <IssueMarker
              issue={issue}
              isSelected={selectedIssue?.id === issue.id}
            />
          </Marker>
        ))}
      </Map>

      {pendingPin && !selectedIssue && (
        <IssueForm
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}

      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          onClose={handleDetailClose}
        />
      )}
    </div>
  )
}