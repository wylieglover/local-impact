import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapGL, {
  Marker,
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

  // 🔥 Smooth visual location (animation layer)
  const [displayLocation, setDisplayLocation] = useState(userLocation)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!userLocation) return

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const animate = () => {
      setDisplayLocation((prev) => {
        if (!prev) return userLocation

        const lerp = 0.15 // tune this (0.1 = smoother, 0.25 = snappier)

        return {
          latitude: prev.latitude + (userLocation.latitude - prev.latitude) * lerp,
          longitude: prev.longitude + (userLocation.longitude - prev.longitude) * lerp,
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [userLocation.latitude, userLocation.longitude])

  // 🧠 OPTIONAL: smooth camera follow (disabled by default)
  const isFollowMode = false

  useEffect(() => {
    if (!isFollowMode || !displayLocation) return

    const map = mapRef.current?.getMap()
    if (!map) return

    map.easeTo({
      center: [displayLocation.longitude, displayLocation.latitude],
      duration: 800,
      easing: (t) => t,
    })
  }, [displayLocation])

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

  const mapStyle ='mapbox://styles/mapbox/standard'
  const mode = useThemeStore((state) => state.mode)
  
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    map.setConfigProperty(
      'basemap',
      'lightPreset',
      mode === 'dark' ? 'night' : 'day'
    )
  }, [mode])

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        latitude: displayLocation.latitude,
        longitude: displayLocation.longitude,
        zoom: 15,
        pitch: 50,
      }}
      mapStyle={mapStyle}
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

      {/* 🔥 YOUR PLAYER (animated) */}
      <Marker latitude={displayLocation.latitude} longitude={displayLocation.longitude} anchor="center">
        <PlayerMarker facing={facing} />
      </Marker>

      {/* OTHER PLAYERS (raw, no animation) */}
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