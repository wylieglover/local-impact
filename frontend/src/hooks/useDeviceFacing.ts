import { useState, useEffect } from 'react'

type UseDeviceFacingReturn = {
  facing: number | null
  // On iOS the permission must be requested via a user gesture.
  // Call this from a button's onClick handler.
  requestPermission: () => Promise<void>
  permissionState: 'unknown' | 'granted' | 'denied' | 'unavailable'
}

export function useDeviceFacing(): UseDeviceFacingReturn {
  const [facing, setFacing] = useState<number | null>(null)
  const [permissionState, setPermissionState] = useState<
    'unknown' | 'granted' | 'denied' | 'unavailable'
  >('unknown')

  const handleOrientation = (e: DeviceOrientationEvent) => {
    // iOS: webkitCompassHeading is true north, 0–360
    const ios = (e as any).webkitCompassHeading
    if (ios != null) {
      setFacing(ios)
      return
    }
    // Android: alpha is CCW from north, invert to get compass bearing
    if (e.alpha != null) {
      setFacing((360 - e.alpha) % 360)
    }
  }

  const attachListeners = () => {
    // Prefer absolute (true north) over relative
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true)
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true)
  }

  const requestPermission = async () => {
    const DeviceOrientationEventTyped = DeviceOrientationEvent as any

    if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEventTyped.requestPermission()
        if (state === 'granted') {
          setPermissionState('granted')
          attachListeners()
        } else {
          setPermissionState('denied')
        }
      } catch {
        setPermissionState('denied')
      }
    } else {
      // Non-iOS: no permission needed, just attach
      setPermissionState('granted')
      attachListeners()
    }
  }

  useEffect(() => {
    const DeviceOrientationEventTyped = DeviceOrientationEvent as any
    const needsPermission =
      typeof DeviceOrientationEventTyped.requestPermission === 'function'

    if (!window.DeviceOrientationEvent) {
      setPermissionState('unavailable')
      return
    }

    // Android / desktop — attach immediately, no permission gate
    if (!needsPermission) {
      setPermissionState('granted')
      attachListeners()
    }
    // iOS — leave as 'unknown', caller must invoke requestPermission()
    // from a user gesture

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true)
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true)
    }
  }, [])

  return { facing, requestPermission, permissionState }
}