'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Save, ChevronDown, ChevronUp, LogOut, User, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rooms: false,
    hours: false,
    services: false,
    timing: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaved(true)
        setIframeKey(prev => prev + 1)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current = newSettings

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      {saved && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">Configuración guardada exitosamente</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-500 mt-1">Gestiona la disponibilidad del calendario</p>
            </div>
            <div className="flex items-center gap-3">
              {session?.user && !isMobile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{session.user.name}</span>
                </div>
              )}
              {!isMobile && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Ocultar' : 'Ver'} Preview
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6 ${showPreview && !isMobile ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-3">
          {/* Calendar Status - Always Visible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Estado del Sistema</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.calendarEnabled ? '✅ Calendario activo' : '🔴 Calendario desactivado'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.calendarEnabled}
                  onChange={(e) => updateSetting('calendarEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </div>

          {/* Timing Settings - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('timing')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">⏰ Tiempos y Anticipación</h2>
              {expandedSections.timing ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.timing && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
                {/* Buffer Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tiempo entre Citas
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      value={settings.bufferTime}
                      onChange={(e) => updateSetting('bufferTime', parseInt(e.target.value))}
                      min="0"
                      max="60"
                      step="5"
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <span className="text-xl font-bold text-black min-w-[70px]">
                      {settings.bufferTime} min
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tiempo de preparación entre cada cita</p>
                </div>

                {/* Minimum Advance Booking Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tiempo Mínimo de Anticipación
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      value={settings.minimumAdvanceBookingHours}
                      onChange={(e) => updateSetting('minimumAdvanceBookingHours', parseInt(e.target.value))}
                      min="1"
                      max="72"
                      step="1"
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <span className="text-xl font-bold text-black min-w-[70px]">
                      {settings.minimumAdvanceBookingHours} hrs
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Tiempo mínimo requerido entre ahora y la hora de la cita</p>
                </div>
              </div>
            )}
          </div>

          {/* Rooms - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('rooms')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">🏠 Control de Salas</h2>
              {expandedSections.rooms ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.rooms && (
              <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-6">
                {Object.entries(settings.rooms).map(([key, room]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{room.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {key === 'individual' ? 'Servicios personalizados' : 'Servicios grupales'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={room.enabled}
                        onChange={(e) => updateSetting(`rooms.${key}.enabled`, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Working Hours - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('hours')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">📅 Horarios de Atención</h2>
              {expandedSections.hours ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.hours && (
              <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-6">
                {Object.entries(settings.workingHours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={hours.enabled}
                          onChange={(e) => updateSetting(`workingHours.${day}.enabled`, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                      <span className="font-medium text-gray-900 w-24">{dayNames[day]}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:flex-1">
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateSetting(`workingHours.${day}.start`, e.target.value)}
                        disabled={!hours.enabled}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:bg-gray-100 text-sm flex-1"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateSetting(`workingHours.${day}.end`, e.target.value)}
                        disabled={!hours.enabled}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:bg-gray-100 text-sm flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('services')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">💆 Gestión de Servicios</h2>
              {expandedSections.services ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.services && (
              <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500 mb-4">Activa o desactiva servicios por categoría</p>
                {settings.services && Object.entries(settings.services).map(([category, services]: [string, any]) => (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 capitalize">{category}</h3>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {services.filter((s: any) => s.enabled).length}/{services.length}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {services.map((service: any, idx: number) => (
                        <div key={service.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {service.duration} min • ${(service.price / 1000).toFixed(0)}k COP
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={service.enabled}
                              onChange={(e) => {
                                const newServices = [...services]
                                newServices[idx] = { ...service, enabled: e.target.checked }
                                updateSetting(`services.${category}`, newServices)
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && !isMobile && (
          <div className="sticky top-24 h-fit">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Vista Previa</h2>
                <button
                  onClick={() => setIframeKey(prev => prev + 1)}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  🔄 Recargar
                </button>
              </div>
              <iframe
                key={iframeKey}
                src="http://localhost:3002"
                className="w-full h-[800px] border-2 border-gray-300 rounded-lg"
                title="Calendar Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
