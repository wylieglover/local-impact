import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapGL, {
  Marker,
  Source,
  AttributionControl,
  type MapRef,
} from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'
import type { PointFeature } from 'supercluster'

import PlayerMarker from './PlayerMarker'
import OtherPlayerMarker from './OtherPlayerMarker'
import IssueMarker from './IssueMarker'
import IssueClusterMarker from './IssueClusterMarker'

import type { Issue } from '../../api/issues.api'
import type { Player } from '../../api/users.api'
import { useThemeStore } from '../../stores/theme.store'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

type Props = {
  userLocation: { latitude: number; longitude: number }
  facing: number | null
  players: Player[]
  issues: Issue[]
  selectedIssue: Issue | null
  pendingPin: { latitude: number; longitude: number } | null
  onMapClick: (e: MapMouseEvent) => void
  onIssueClick: (issue: Issue) => void
  onBoundsChange: (bounds: [number, number, number, number], zoom: number) => void
  onPlayerClick: (player: Player, position: { x: number; y: number }) => void
}

export default function MapView({
  userLocation,
  facing,
  players,
  issues,
  selectedIssue,
  pendingPin,
  onMapClick,
  onIssueClick,
  onBoundsChange,
  onPlayerClick
}: Props) {
  const mapRef = useRef<MapRef>(null)

  const [zoom, setZoom] = useState(15)
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null)

  const mode = useThemeStore((state) => state.mode)

  // Smooth camera follow (optional)
  const isFollowMode = false

  useEffect(() => {
    if (!isFollowMode || !userLocation) return

    const map = mapRef.current?.getMap()
    if (!map) return

    map.easeTo({
      center: [userLocation.longitude, userLocation.latitude],
      duration: 600,
      easing: (t) => t,
    })
  }, [userLocation, isFollowMode])

  // Update theme dynamically
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.setConfigProperty(
      'basemap',
      'lightPreset',
      mode === 'dark' ? 'night' : 'day'
    )
  }, [mode])

  const onMove = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    const newBounds: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
    setBounds(newBounds)
    setZoom(map.getZoom())
    onBoundsChange(newBounds, map.getZoom())
  }, [onBoundsChange])

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

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        zoom: 15,
        pitch: 50,
      }}
      mapStyle="mapbox://styles/mapbox/standard"
      styleDiffing={false}
      terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      onMove={onMove}
      onLoad={() => {
        const map = mapRef.current?.getMap()
        if (!map) return

        map.setConfigProperty(
          'basemap',
          'lightPreset',
          mode === 'dark' ? 'night' : 'day'
        )

        onMove()
      }}
      onClick={onMapClick}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <AttributionControl position="bottom-right" compact />

      {/* 🔥 YOU */}
      <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
        <PlayerMarker facing={facing} />
      </Marker>

      {/* OTHER PLAYERS */}
      {players.map((player) => (
        <Marker
          key={player.id}
          latitude={player.latitude}
          longitude={player.longitude}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            onPlayerClick(player, {
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY,
            })
          }}
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
                  const expansionZoom = Math.min(cluster.getClusterExpansionZoom(clusterId) ?? 20, 20)
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
              onIssueClick(issue)
            }}
          >
            <IssueMarker issue={issue} isSelected={selectedIssue?.id === issue.id} />
          </Marker>
        )
      })}
    </MapGL>
  )
}