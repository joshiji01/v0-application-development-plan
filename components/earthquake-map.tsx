"use client"

import { useEffect, useRef, useState } from "react"

interface Earthquake {
  id: string
  properties: {
    mag: number
    place: string
    time: number
    title: string
  }
  geometry: {
    coordinates: [number, number, number]
  }
}

interface EarthquakeMapProps {
  earthquakes: Earthquake[]
  loading: boolean
}

export default function EarthquakeMap({ earthquakes, loading }: EarthquakeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => {
          console.log("[v0] Leaflet loaded successfully")
          setLeafletLoaded(true)
        }
        script.onerror = () => {
          console.error("[v0] Failed to load Leaflet")
        }
        document.head.appendChild(script)
      } else {
        setLeafletLoaded(true)
      }
    }

    loadLeaflet()
  }, [])

  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || !(window as any).L) return

    const L = (window as any).L

    // Initialize map
    if (!mapInstanceRef.current) {
      console.log("[v0] Initializing map")
      mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 2)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current)

      markersRef.current = L.layerGroup().addTo(mapInstanceRef.current)
    }

    return () => {
      if (mapInstanceRef.current) {
        console.log("[v0] Cleaning up map")
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded])

  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current || loading || !leafletLoaded || !(window as any).L) return

    const L = (window as any).L

    // Clear existing markers
    markersRef.current.clearLayers()
    console.log("[v0] Adding", earthquakes.length, "earthquake markers")

    // Add earthquake markers
    earthquakes.forEach((earthquake) => {
      const [lng, lat] = earthquake.geometry.coordinates
      const magnitude = earthquake.properties.mag

      // Determine marker color and size based on magnitude
      let color = "#22c55e" // green for micro
      let radius = 5

      if (magnitude >= 7) {
        color = "#dc2626" // red for major
        radius = 15
      } else if (magnitude >= 5) {
        color = "#f97316" // orange for moderate
        radius = 12
      } else if (magnitude >= 3) {
        color = "#eab308" // yellow for light
        radius = 9
      } else if (magnitude >= 1) {
        color = "#3b82f6" // blue for minor
        radius = 7
      }

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: color,
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7,
      })

      // Add popup with earthquake details
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-sm mb-1">M${magnitude.toFixed(1)} Earthquake</h3>
          <p class="text-sm mb-1">${earthquake.properties.place}</p>
          <p class="text-xs text-gray-600">${new Date(earthquake.properties.time).toLocaleString()}</p>
          <p class="text-xs text-gray-600">Depth: ${Math.abs(earthquake.geometry.coordinates[2])} km</p>
        </div>
      `)

      markersRef.current?.addLayer(marker)
    })
  }, [earthquakes, loading, leafletLoaded])

  if (!leafletLoaded) {
    return (
      <div className="h-[600px] w-full rounded-lg border border-border flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="h-[600px] w-full rounded-lg overflow-hidden border border-border"
      style={{ minHeight: "600px" }}
    />
  )
}
