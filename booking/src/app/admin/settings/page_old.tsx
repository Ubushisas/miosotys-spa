'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Save, Clock, Calendar as CalendarIcon, Lock, Eye, EyeOff, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, MoreVertical, Copy, Edit, LogOut, User } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Service Item Component
function SortableServiceItem({ service, idx, category, services, updateSetting }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition"
      >
        <GripVertical className="w-5 h-5" />
      </div>
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
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
      </label>
    </div>
  )
}

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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    individual: true,
    parejas: false,
    amigas: false,
    familia: false,
    eventos: false,
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    calendar: true,
    rooms: false,
    hours: false,
    services: false,
    timing: false,
  })
  const [openMenuCategory, setOpenMenuCategory] = useState<string | null>(null)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false)
  const [showDuplicateCategoryModal, setShowDuplicateCategoryModal] = useState(false)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  const [modalCategoryName, setModalCategoryName] = useState('')
  const [modalCategoryId, setModalCategoryId] = useState('')
  const [newService, setNewService] = useState({
    name: '',
    duration: 60,
    price: 100000
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
        // Reload iframe to show changes
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

  const addBlockedDate = () => {
    const dateInput = document.getElementById('blocked-date-input') as HTMLInputElement
    const date = dateInput.value
    if (date && !settings.blockedDates.includes(date)) {
      setSettings((prev: any) => ({
        ...prev,
        blockedDates: [...prev.blockedDates, date].sort(),
      }))
      dateInput.value = ''
    }
  }

  const removeBlockedDate = (date: string) => {
    setSettings((prev: any) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((d: string) => d !== date),
    }))
  }

  const addCategory = () => {
    setModalCategoryName('')
    setShowAddCategoryModal(true)
  }

  const confirmAddCategory = () => {
    if (!modalCategoryName || modalCategoryName.trim() === '') return

    const categoryId = modalCategoryName.toLowerCase().replace(/\s+/g, '_')

    if (settings.services[categoryId]) {
      alert('Esta categoría ya existe')
      return
    }

    setSettings((prev: any) => ({
      ...prev,
      services: {
        ...prev.services,
        [categoryId]: []
      }
    }))

    setExpandedCategories(prev => ({ ...prev, [categoryId]: true }))
    setShowAddCategoryModal(false)
    setModalCategoryName('')
  }

  const deleteCategory = (category: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category}"?`)) return

    setSettings((prev: any) => {
      const newServices = { ...prev.services }
      delete newServices[category]
      return {
        ...prev,
        services: newServices
      }
    })

    setExpandedCategories(prev => {
      const newExpanded = { ...prev }
      delete newExpanded[category]
      return newExpanded
    })
    setOpenMenuCategory(null)
  }

  const duplicateCategory = (category: string) => {
    setModalCategoryId(category)
    setModalCategoryName(`${category}_copia`)
    setShowDuplicateCategoryModal(true)
    setOpenMenuCategory(null)
  }

  const confirmDuplicateCategory = () => {
    if (!modalCategoryName || modalCategoryName.trim() === '') return

    const newCategoryId = modalCategoryName.toLowerCase().replace(/\s+/g, '_')

    if (settings.services[newCategoryId]) {
      alert('Esta categoría ya existe')
      return
    }

    // Duplicate services from the original category
    const originalServices = settings.services[modalCategoryId]
    const duplicatedServices = originalServices.map((service: any) => ({
      ...service,
      id: `${service.id}_${Date.now()}` // Generate unique ID
    }))

    setSettings((prev: any) => ({
      ...prev,
      services: {
        ...prev.services,
        [newCategoryId]: duplicatedServices
      }
    }))

    setExpandedCategories(prev => ({ ...prev, [newCategoryId]: true }))
    setShowDuplicateCategoryModal(false)
    setModalCategoryName('')
    setModalCategoryId('')
  }

  const renameCategory = (category: string) => {
    setModalCategoryId(category)
    setModalCategoryName(category)
    setShowRenameCategoryModal(true)
    setOpenMenuCategory(null)
  }

  const confirmRenameCategory = () => {
    if (!modalCategoryName || modalCategoryName.trim() === '' || modalCategoryName === modalCategoryId) return

    const newCategoryId = modalCategoryName.toLowerCase().replace(/\s+/g, '_')

    if (settings.services[newCategoryId]) {
      alert('Esta categoría ya existe')
      return
    }

    setSettings((prev: any) => {
      const newServices = { ...prev.services }
      newServices[newCategoryId] = newServices[modalCategoryId]
      delete newServices[modalCategoryId]

      return {
        ...prev,
        services: newServices
      }
    })

    setExpandedCategories(prev => {
      const newExpanded = { ...prev }
      newExpanded[newCategoryId] = newExpanded[modalCategoryId]
      delete newExpanded[modalCategoryId]
      return newExpanded
    })
    setShowRenameCategoryModal(false)
    setModalCategoryName('')
    setModalCategoryId('')
  }

  const addService = (category: string) => {
    setModalCategoryId(category)
    setNewService({
      name: '',
      duration: 60,
      price: 100000
    })
    setShowAddServiceModal(true)
  }

  const confirmAddService = () => {
    if (!newService.name || newService.name.trim() === '') return

    const serviceId = `${newService.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

    const service = {
      id: serviceId,
      name: newService.name,
      duration: newService.duration,
      price: newService.price,
      enabled: true
    }

    setSettings((prev: any) => {
      const categoryServices = [...prev.services[modalCategoryId], service]
      return {
        ...prev,
        services: {
          ...prev.services,
          [modalCategoryId]: categoryServices
        }
      }
    })

    setShowAddServiceModal(false)
    setNewService({ name: '', duration: 60, price: 100000 })
    setModalCategoryId('')
  }

  const handleDragEnd = async (event: DragEndEvent, category: string) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const services = settings.services[category]
      const oldIndex = services.findIndex((s: any) => s.id === active.id)
      const newIndex = services.findIndex((s: any) => s.id === over.id)

      const newServices = arrayMove(services, oldIndex, newIndex)
      updateSetting(`services.${category}`, newServices)

      // Auto-save after reordering
      const newSettings = { ...settings }
      newSettings.services[category] = newServices

      try {
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        })
      } catch (error) {
        console.error('Failed to auto-save reordered services:', error)
      }
    }
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
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">Configuración guardada exitosamente</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Control del Calendario</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestiona la disponibilidad y configuración</p>
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
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 text-sm sm:text-base"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
                <span className="sm:hidden">{saving ? '...' : 'Guardar'}</span>
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-3">
          {/* Calendar Status - Always Visible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Estado del Sistema</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.calendarEnabled ? '✅ Calendario activo - Los clientes pueden reservar' : '🔴 Calendario desactivado - No se aceptan reservas'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.calendarEnabled}
                  onChange={(e) => updateSetting('calendarEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </div>

          {/* Rooms - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, rooms: !prev.rooms }))}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-900">Control de Salas</h2>
              {expandedSections.rooms ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {expandedSections.rooms && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
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
                      <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Working Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Horarios de Atención</h2>
              <div className="space-y-3">
                {Object.entries(settings.workingHours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={hours.enabled}
                          onChange={(e) => updateSetting(`workingHours.${day}.enabled`, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                      <div className="flex-1 sm:w-28">
                        <span className="font-medium text-gray-900">{dayNames[day]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:flex-1">
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateSetting(`workingHours.${day}.start`, e.target.value)}
                        disabled={!hours.enabled}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 text-sm flex-1"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateSetting(`workingHours.${day}.end`, e.target.value)}
                        disabled={!hours.enabled}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 text-sm flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Servicios</h2>
                <p className="text-sm text-gray-500 mt-1">Activa o desactiva servicios para cada categoría y reorganízalos</p>
              </div>

              {settings.services && Object.entries(settings.services).map(([category, services]: [string, any]) => (
                <div key={category} className="mb-4 last:mb-0 border border-gray-200 rounded-lg overflow-visible">
                  <button
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:text-gray-600 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <h3 className="font-medium text-gray-900 capitalize">{category}</h3>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {services.filter((s: any) => s.enabled).length}/{services.length}
                      </span>
                    </div>
                    {expandedCategories[category] ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {expandedCategories[category] && (
                    <div className="p-4 space-y-2 bg-white">
                      <p className="text-sm text-gray-500 mb-3">Arrastra para reorganizar los servicios</p>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, category)}
                      >
                        <SortableContext
                          items={services.map((s: any) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {services.map((service: any, idx: number) => (
                            <SortableServiceItem
                              key={service.id}
                              service={service}
                              idx={idx}
                              category={category}
                              services={services}
                              updateSetting={updateSetting}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Buffer Time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tiempo entre Citas</h2>
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
                <span className="text-2xl font-bold text-black min-w-[80px]">
                  {settings.bufferTime} min
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Tiempo de preparación entre cada cita</p>
            </div>

            {/* Minimum Advance Booking Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tiempo Mínimo de Anticipación</h2>
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
                <span className="text-2xl font-bold text-black min-w-[80px]">
                  {settings.minimumAdvanceBookingHours} hrs
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Tiempo mínimo requerido entre ahora y la hora de la cita</p>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && !isMobile && (
            <div className="sticky top-24 h-fit">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Vista Previa del Calendario</h2>
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
                  className="w-full h-[900px] border-2 border-gray-300 rounded-lg"
                  title="Calendar Preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Categoría</h3>
            <input
              type="text"
              value={modalCategoryName}
              onChange={(e) => setModalCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAddCategory()}
              placeholder="Nombre de la categoría"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCategoryModal(false)
                  setModalCategoryName('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddCategory}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Category Modal */}
      {showRenameCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Renombrar Categoría</h3>
            <input
              type="text"
              value={modalCategoryName}
              onChange={(e) => setModalCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmRenameCategory()}
              placeholder="Nuevo nombre"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRenameCategoryModal(false)
                  setModalCategoryName('')
                  setModalCategoryId('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRenameCategory}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Category Modal */}
      {showDuplicateCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Duplicar Categoría</h3>
            <input
              type="text"
              value={modalCategoryName}
              onChange={(e) => setModalCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmDuplicateCategory()}
              placeholder="Nombre de la nueva categoría"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDuplicateCategoryModal(false)
                  setModalCategoryName('')
                  setModalCategoryId('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDuplicateCategory}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Servicio</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del servicio</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Ej: Masaje Relajante"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 0 })}
                  min="15"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP)</label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) || 0 })}
                  min="0"
                  step="10000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">${(newService.price / 1000).toFixed(0)}k COP</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddServiceModal(false)
                  setNewService({ name: '', duration: 60, price: 100000 })
                  setModalCategoryId('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddService}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
