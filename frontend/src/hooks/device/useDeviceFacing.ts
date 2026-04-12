import { useState, useEffect, useRef } from 'react'

type UseDeviceFacingReturn = {
  facing: number | null
  requestPermission: () => Promise<void>
  permissionState: 'unknown' | 'granted' | 'denied' | 'unavailable'
}

export function useDeviceFacing(): UseDeviceFacingReturn {
  const [facing, setFacing] = useState<number | null>(null)

  const [permissionState, setPermissionState] = useState<
    'unknown' | 'granted' | 'denied' | 'unavailable'
  >(() => {
    const saved = localStorage.getItem('compassPermission')
    return (saved as any) || 'unknown'
  })

  const hasReceivedEventRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  // throttling + smoothing helpers
  const lastUpdateRef = useRef(0)
  const calibrationCount = useRef(0)
  const smoothedFacing = useRef<number | null>(null)

  const handleOrientation = (e: DeviceOrientationEvent) => {
    const now = performance.now()

    // THROTTLE: ~20fps max (prevents 60–120Hz spam)
    if (now - lastUpdateRef.current < 50) return
    lastUpdateRef.current = now

    hasReceivedEventRef.current = true

    // iOS compass shortcut
    const ios = (e as any).webkitCompassHeading
    let rawFacing: number | null = null

    if (ios != null) {
      rawFacing = ios
    } else if (e.alpha != null) {
      rawFacing = (360 - e.alpha) % 360
    }

    if (rawFacing == null) return

    // Calibration buffer (fixes “wrong direction until I spin phone”)
    if (calibrationCount.current < 5) {
      calibrationCount.current++
      smoothedFacing.current = rawFacing
      setFacing(rawFacing)
      return
    }

    // light smoothing (prevents jitter)
    if (smoothedFacing.current == null) {
      smoothedFacing.current = rawFacing
    } else {
      const prev = smoothedFacing.current

      // shortest rotation path (avoids 359° → 0° jump glitch)
      const diff = ((rawFacing - prev + 540) % 360) - 180
      smoothedFacing.current = (prev + diff * 0.25 + 360) % 360
    }

    setFacing(smoothedFacing.current)
  }

  const attachListeners = () => {
    window.addEventListener(
      'deviceorientationabsolute',
      handleOrientation as EventListener,
      true
    )
    window.addEventListener(
      'deviceorientation',
      handleOrientation as EventListener,
      true
    )
  }

  const detachListeners = () => {
    window.removeEventListener(
      'deviceorientationabsolute',
      handleOrientation as EventListener,
      true
    )
    window.removeEventListener(
      'deviceorientation',
      handleOrientation as EventListener,
      true
    )
  }

  const requestPermission = async () => {
    const DeviceOrientationEventTyped = DeviceOrientationEvent as any

    if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEventTyped.requestPermission()

        if (state === 'granted') {
          setPermissionState('granted')
          localStorage.setItem('compassPermission', 'granted')

          hasReceivedEventRef.current = false
          calibrationCount.current = 0
          attachListeners()
          startValidationCheck()
        } else {
          setPermissionState('denied')
          localStorage.setItem('compassPermission', 'denied')
        }
      } catch {
        setPermissionState('denied')
        localStorage.setItem('compassPermission', 'denied')
      }
    } else {
      setPermissionState('granted')
      localStorage.setItem('compassPermission', 'granted')

      hasReceivedEventRef.current = false
      calibrationCount.current = 0
      attachListeners()
      startValidationCheck()
    }
  }

  const startValidationCheck = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(() => {
      if (
        permissionState === 'granted' &&
        !hasReceivedEventRef.current
      ) {
        setPermissionState('unknown')
        localStorage.removeItem('compassPermission')
        detachListeners()
      }
    }, 1500)
  }

  useEffect(() => {
    const DeviceOrientationEventTyped = DeviceOrientationEvent as any
    const needsPermission =
      typeof DeviceOrientationEventTyped.requestPermission === 'function'

    if (!window.DeviceOrientationEvent) {
      setPermissionState('unavailable')
      return
    }

    if (permissionState === 'granted') {
      hasReceivedEventRef.current = false
      calibrationCount.current = 0
      attachListeners()

      setTimeout(() => {
        if (!hasReceivedEventRef.current) {
          setPermissionState('unknown')
        }
      }, 1500)
    }

    if (!needsPermission && permissionState !== 'granted') {
      setPermissionState('granted')
      localStorage.setItem('compassPermission', 'granted')

      hasReceivedEventRef.current = false
      calibrationCount.current = 0
      attachListeners()
    }

    return () => {
      detachListeners()
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [permissionState])

  return { facing, requestPermission, permissionState }
}