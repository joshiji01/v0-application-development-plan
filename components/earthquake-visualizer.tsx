"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Loader2, RefreshCw, Filter, TrendingUp, Globe, AlertTriangle } from "lucide-react"

// Dynamically import the map to avoid SSR issues
const EarthquakeMap = dynamic(() => import("./earthquake-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Loading map...</span>
    </div>
  ),
})

interface Earthquake {
  id: string
  properties: {
    mag: number
    place: string
    time: number
    updated: number
    tz: number
    url: string
    detail: string
    felt: number | null
    cdi: number | null
    mmi: number | null
    alert: string | null
    status: string
    tsunami: number
    sig: number
    net: string
    code: string
    ids: string
    sources: string
    types: string
    nst: number | null
    dmin: number | null
    rms: number
    gap: number | null
    magType: string
    type: string
    title: string
  }
  geometry: {
    type: string
    coordinates: [number, number, number] // [longitude, latitude, depth]
  }
}

interface EarthquakeData {
  type: string
  metadata: {
    generated: number
    url: string
    title: string
    status: number
    api: string
    count: number
  }
  features: Earthquake[]
}

export default function EarthquakeVisualizer() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [filteredEarthquakes, setFilteredEarthquakes] = useState<Earthquake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [magnitudeFilter, setMagnitudeFilter] = useState([0])
  const [timeFilter, setTimeFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchEarthquakeData()
  }, [])

  useEffect(() => {
    let filtered = earthquakes

    // Filter by magnitude
    if (magnitudeFilter[0] > 0) {
      filtered = filtered.filter((eq) => eq.properties.mag >= magnitudeFilter[0])
    }

    // Filter by time
    if (timeFilter !== "all") {
      const now = Date.now()
      const timeThreshold =
        {
          "1h": 60 * 60 * 1000,
          "6h": 6 * 60 * 60 * 1000,
          "12h": 12 * 60 * 60 * 1000,
        }[timeFilter] || 0

      filtered = filtered.filter((eq) => now - eq.properties.time <= timeThreshold)
    }

    setFilteredEarthquakes(filtered)
  }, [earthquakes, magnitudeFilter, timeFilter])

  const fetchEarthquakeData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: EarthquakeData = await response.json()
      setEarthquakes(data.features)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching earthquake data:", err)
      setError("Failed to load earthquake data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 7) return "bg-destructive"
    if (magnitude >= 5) return "bg-orange-500"
    if (magnitude >= 3) return "bg-yellow-500"
    if (magnitude >= 1) return "bg-blue-500"
    return "bg-green-500"
  }

  const getMagnitudeLabel = (magnitude: number) => {
    if (magnitude >= 7) return "Major"
    if (magnitude >= 5) return "Moderate"
    if (magnitude >= 3) return "Light"
    if (magnitude >= 1) return "Minor"
    return "Micro"
  }

  const significantEarthquakes = filteredEarthquakes
    .filter((eq) => eq.properties.mag >= 2.5)
    .sort((a, b) => b.properties.mag - a.properties.mag)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-4 py-8 animate-slide-up">
          <div className="inline-flex items-center space-x-2 text-primary mb-2">
            <Globe className="h-8 w-8" />
            <span className="text-sm font-medium tracking-wide uppercase">Real-time Seismic Data</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Earthquake Visualizer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore global seismic activity with interactive maps and real-time data visualization
          </p>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleString()}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="hover-lift">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEarthquakeData}
              disabled={loading}
              className="hover-lift bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 bg-card rounded-lg border animate-slide-up">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Min Magnitude:</span>
                <div className="w-32">
                  <Slider
                    value={magnitudeFilter}
                    onValueChange={setMagnitudeFilter}
                    max={8}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <span className="text-sm text-muted-foreground min-w-[2rem]">{magnitudeFilter[0]}+</span>
              </div>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="12h">Last 12 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
          <Card className="hover-lift border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>Total Earthquakes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary">{filteredEarthquakes.length}</div>
              <p className="text-xs text-muted-foreground">
                {magnitudeFilter[0] > 0 ? `Magnitude ${magnitudeFilter[0]}+` : "All magnitudes"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <span>Significant Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-accent">
                {filteredEarthquakes.filter((eq) => eq.properties.mag >= 2.5).length}
              </div>
              <p className="text-xs text-muted-foreground">Magnitude 2.5+</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-destructive" />
                <span>Strongest Event</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-destructive">
                {filteredEarthquakes.length > 0
                  ? Math.max(...filteredEarthquakes.map((eq) => eq.properties.mag)).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-muted-foreground">Maximum magnitude</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-l-4 border-l-chart-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <div className="h-4 w-4 bg-chart-4 rounded-full"></div>
                <span>Average Magnitude</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-chart-4">
                {filteredEarthquakes.length > 0
                  ? (
                      filteredEarthquakes.reduce((sum, eq) => sum + eq.properties.mag, 0) / filteredEarthquakes.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-muted-foreground">Mean magnitude</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card className="hover-lift overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <span>Interactive Earthquake Map</span>
                </CardTitle>
                <CardDescription>Explore earthquake locations and magnitudes with color-coded markers</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {error ? (
                  <div className="flex items-center justify-center h-[600px] bg-muted/20">
                    <div className="text-center space-y-4">
                      <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                      <div>
                        <p className="text-destructive font-medium">Error loading earthquake data</p>
                        <p className="text-sm text-muted-foreground mt-1">{error}</p>
                      </div>
                      <Button onClick={fetchEarthquakeData} className="hover-lift">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EarthquakeMap earthquakes={filteredEarthquakes} loading={loading} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="hover-lift">
              <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <span>Recent Significant Events</span>
                </CardTitle>
                <CardDescription>Magnitude 2.5+ earthquakes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : significantEarthquakes.length > 0 ? (
                  significantEarthquakes.map((earthquake, index) => (
                    <div
                      key={earthquake.id}
                      className="border-b border-border pb-4 last:border-b-0 animate-slide-up hover-lift p-2 rounded-lg hover:bg-muted/20 transition-colors"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${getMagnitudeColor(earthquake.properties.mag)} animate-pulse-glow`}>
                          M{earthquake.properties.mag.toFixed(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {getMagnitudeLabel(earthquake.properties.mag)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground leading-tight mb-1">
                        {earthquake.properties.place}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(earthquake.properties.time).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No significant earthquakes match your current filters
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="h-5 w-5 bg-gradient-to-r from-green-500 to-red-500 rounded-full"></div>
                  <span>Magnitude Scale</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { color: "bg-green-500", label: "Micro", range: "<1.0", description: "Usually not felt" },
                  { color: "bg-blue-500", label: "Minor", range: "1.0-2.9", description: "Rarely felt" },
                  { color: "bg-yellow-500", label: "Light", range: "3.0-4.9", description: "Often felt" },
                  { color: "bg-orange-500", label: "Moderate", range: "5.0-6.9", description: "Damaging" },
                  { color: "bg-red-600", label: "Major", range: "7.0+", description: "Serious damage" },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-4 h-4 rounded-full ${item.color} animate-pulse-glow`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.range}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
