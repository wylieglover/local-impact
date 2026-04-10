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

  const handleOrientation = (e: DeviceOrientationEvent) => {
    hasReceivedEventRef.current = true

    const ios = (e as any).webkitCompassHeading
    if (ios != null) {
      setFacing(ios)
      return
    }

    if (e.alpha != null) {
      setFacing((360 - e.alpha) % 360)
    }
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
      // Android / desktop
      setPermissionState('granted')
      localStorage.setItem('compassPermission', 'granted')

      hasReceivedEventRef.current = false
      attachListeners()
      startValidationCheck()
    }
  }

  const startValidationCheck = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(() => {
      // If we "think" we're granted but no events fired → it's broken (common iOS PWA issue)
      if (permissionState === 'granted' && !hasReceivedEventRef.current) {
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

    // If we THINK we are granted, try activating
    if (permissionState === 'granted') {
      hasReceivedEventRef.current = false
      attachListeners()
      startValidationCheck()
    }

    // Non-iOS auto-enable
    if (!needsPermission && permissionState !== 'granted') {
      setPermissionState('granted')
      localStorage.setItem('compassPermission', 'granted')

      hasReceivedEventRef.current = false
      attachListeners()
    }

    return () => {
      detachListeners()
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [permissionState])

  return { facing, requestPermission, permissionState }
}