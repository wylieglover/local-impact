import { useCallback, useMemo, useRef, useState } from 'react'
import MapGL, {
  Marker,
  NavigationControl,
  AttributionControl,
  type MapRef,
} from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapMouseEvent } from 'react-map-gl/mapbox'

import Supercluster from 'supercluster'
import type { PointFeature } from 'supercluster'
import IssueForm from '../Issues/IssueForm'
import IssueDetail from '../Issues/IssueDetail'
import PointsCounter from '../UI/PointsCounter'
import PlayerMarker from './PlayerMarker'
import OtherPlayerMarker from './OtherPlayerMarker'
import IssueMarker from './IssueMarker'
import IssueClusterMarker from './IssueClusterMarker'
import MapControls from './MapControls'

import { useAuthStore } from '../../stores/auth.store'
import { useDeviceFacing } from '../../hooks/useDeviceFacing'
import { useIssues } from '../../hooks/useIssues'
import { useNearbyIssues } from '../../hooks/useNearbyIssues'
import { usePlayerLocation } from '../../hooks/usePlayerLocation'
import { useNearbyPlayers } from '../../hooks/useNearbyPlayers'
import { issuesApi } from '../../api/issues.api'
import type { Issue } from '../../api/issues.api'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

export default function MapView() {
  // ✅ Fix 1: usePlayerLocation replaces the one-shot getCurrentPosition —
  // watchPosition runs continuously so the marker follows the user as they move
  const { userLocation, locationError } = usePlayerLocation()

  const [pendingPin, setPendingPin] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [zoom, setZoom] = useState(15)
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null)

  // ✅ Fix 2: MapRef instead of any — gives us typed access to getMap(),
  // getBounds(), easeTo(), etc. without casting
  const mapRef = useRef<MapRef>(null)

  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const { issues, addIssue, mergeIssues, removeIssue } = useIssues()
  const { facing, requestPermission, permissionState } = useDeviceFacing()

  const { loading: loadingNearby, error: nearbyError, refresh } = useNearbyIssues(
    userLocation,
    mergeIssues,
    { radius: 1609 }
  )

  // Nearby players — polls every 5s automatically inside the hook
  const { players } = useNearbyPlayers(userLocation, { radius: 1609 })

  // Supercluster setup
  const points: PointFeature<{ issueId: string }>[] = useMemo(() => {
    const uniqueLocationsMap = new Map<string, Issue>()
    issues.forEach((issue) => {
      const key = `${issue.latitude.toFixed(6)},${issue.longitude.toFixed(6)}`
      uniqueLocationsMap.set(key, issue)
    })
    return Array.from(uniqueLocationsMap.values()).map((issue) => ({
      type: 'Feature' as const,
      properties: { issueId: issue.id },
      geometry: {
        type: 'Point' as const,
        coordinates: [issue.longitude, issue.latitude],
      },
    }))
  }, [issues])

  const cluster = useMemo(() => {
    const sc = new Supercluster<{ issueId: string }>({ radius: 40, maxZoom: 14 })
    sc.load(points)
    return sc
  }, [points])

  const clusters = useMemo(() => {
    if (!bounds) return []
    return cluster.getClusters(bounds, Math.round(zoom))
  }, [cluster, bounds, zoom])

  const onMove = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    setZoom(map.getZoom())
  }, [])

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (selectedIssue) { setSelectedIssue(null); return }
    setPendingPin({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })
  }, [selectedIssue])

  const handleFormSubmit = useCallback(async (description: string, photo: File | null) => {
    if (!pendingPin || !user) return
    const { issue, newTotalPoints } = await issuesApi.create({
      description,
      latitude: pendingPin.latitude,
      longitude: pendingPin.longitude,
      photo: photo ?? undefined,
    })
    addIssue(issue)
    setAuth(useAuthStore.getState().accessToken!, { ...user, points: newTotalPoints })
    setPendingPin(null)
  }, [pendingPin, user, addIssue, setAuth])

  const handleFormClose = useCallback(() => setPendingPin(null), [])
  const handleDetailClose = useCallback(() => setSelectedIssue(null), [])

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
    <div className="relative w-full h-full">
      <PointsCounter />
      <MapControls loading={loadingNearby} error={nearbyError} onRetry={refresh} />
      
      {/* iOS compass permission prompt — only appears when needed */}
      {permissionState === 'unknown' && (
        <button
          onClick={requestPermission}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl backdrop-blur-sm"
        >
          Enable Compass
        </button>
      )}

      <MapGL
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          zoom: 15,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onMove={onMove}
        onLoad={onMove}
        onClick={handleMapClick}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />
        <AttributionControl position="top-right" compact />
        
        {/* Self marker */}
        <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
          <PlayerMarker facing={facing} />
        </Marker>

        {/* Other players — rendered beneath issues so issue markers stay tappable */}
        {players.map((player) => (
          <Marker
            key={player.id}
            latitude={player.latitude}
            longitude={player.longitude}
            anchor="center"
          >
            <OtherPlayerMarker username={player.username} />
          </Marker>
        ))}

        {pendingPin && (
          <Marker latitude={pendingPin.latitude} longitude={pendingPin.longitude} anchor="bottom">
            <div className="text-2xl animate-bounce">📍</div>
          </Marker>
        )}

        {clusters.map(clusterItem => {
          const [lng, lat] = clusterItem.geometry.coordinates

          if ('cluster' in clusterItem.properties) {
            const clusterProps = clusterItem.properties as Supercluster.ClusterProperties
            const clusterId = clusterItem.id as number

            return (
              <Marker key={`cluster-${clusterId}`} longitude={lng} latitude={lat}>
                <IssueClusterMarker
                  count={clusterProps.point_count}
                  pointCount={clusterProps.point_count}
                  onExpand={() => {
                    const map = mapRef.current?.getMap()
                    if (!map) return
                    const expansionZoom = Math.min(
                      cluster.getClusterExpansionZoom(clusterId) ?? 20,
                      20
                    )
                    map.easeTo({ center: [lng, lat], zoom: expansionZoom })
                  }}
                />
              </Marker>
            )
          }

          const issue = issues.find(i => i.id === clusterItem.properties.issueId)
          if (!issue) return null

          return (
            <Marker
              key={issue.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedIssue(issue)
                setPendingPin(null)
              }}
            >
              <IssueMarker issue={issue} isSelected={selectedIssue?.id === issue.id} />
            </Marker>
          )
        })}
      </MapGL>

      {pendingPin && !selectedIssue && <IssueForm onClose={handleFormClose} onSubmit={handleFormSubmit} />}
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
    </div>
  )
}