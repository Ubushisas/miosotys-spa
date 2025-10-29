'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconCalendarEvent,
  IconClock,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconRefresh,
  IconFilter,
  IconChevronDown,
} from '@tabler/icons-react'

interface Appointment {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  calendarType: 'individual' | 'principal'
  calendarName: string
  attendees?: Array<{ email: string }>
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'individual' | 'principal'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/appointments')
      const data = await response.json()
      if (data.success) {
        setAppointments(data.events)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true
    return apt.calendarType === filter
  })

  const parseDescription = (description?: string) => {
    if (!description) return {}

    const lines = description.split('\n')
    const contact: any = {}

    lines.forEach((line) => {
      if (line.startsWith('Nombre:')) contact.name = line.replace('Nombre:', '').trim()
      if (line.startsWith('Teléfono:')) contact.phone = line.replace('Teléfono:', '').trim()
      if (line.startsWith('Email:')) contact.email = line.replace('Email:', '').trim()
    })

    return contact
  }

  const formatDateTime = (dateTime?: string, date?: string) => {
    const dt = new Date(dateTime || date || '')
    return {
      date: dt.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: dateTime ? dt.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : 'Todo el día',
    }
  }

  const getStatusColor = (start?: string, end?: string) => {
    if (!start && !end) return 'bg-gray-500'

    const now = new Date()
    const startDate = new Date(start || end || '')
    const endDate = new Date(end || start || '')

    if (now < startDate) return 'bg-blue-500' // Upcoming
    if (now >= startDate && now <= endDate) return 'bg-green-500' // In progress
    return 'bg-gray-500' // Past
  }

  const getStatusText = (start?: string, end?: string) => {
    if (!start && !end) return 'Pasado'

    const now = new Date()
    const startDate = new Date(start || end || '')
    const endDate = new Date(end || start || '')

    if (now < startDate) return 'Próximo'
    if (now >= startDate && now <= endDate) return 'En curso'
    return 'Pasado'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Citas Programadas
              </h1>
              <p className="text-gray-600">
                Gestiona todas las reservas de ambas salas
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchAppointments}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <IconRefresh className="w-5 h-5" />
              Actualizar
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-3"
        >
          {[
            { value: 'all', label: 'Todas las Salas' },
            { value: 'individual', label: 'Sala Individual' },
            { value: 'principal', label: 'Sala Principal' },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === filterOption.value
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-xl border border-gray-200 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total de Citas</p>
                <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-black bg-opacity-10 rounded-lg flex items-center justify-center">
                <IconCalendarEvent className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Sala Individual</p>
                <p className="text-3xl font-bold text-gray-900">
                  {appointments.filter((a) => a.calendarType === 'individual').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <IconMapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Sala Principal</p>
                <p className="text-3xl font-bold text-gray-900">
                  {appointments.filter((a) => a.calendarType === 'principal').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <IconMapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAppointments.map((appointment, index) => {
                const { date, time } = formatDateTime(
                  appointment.start.dateTime,
                  appointment.start.date
                )
                const contact = parseDescription(appointment.description)
                const isExpanded = expandedId === appointment.id
                const statusColor = getStatusColor(
                  appointment.start.dateTime,
                  appointment.end.dateTime
                )
                const statusText = getStatusText(
                  appointment.start.dateTime,
                  appointment.end.dateTime
                )

                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : appointment.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {statusText}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.calendarType === 'individual'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {appointment.calendarName}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {appointment.summary}
                          </h3>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <IconCalendarEvent className="w-4 h-4" />
                              {date}
                            </div>
                            <div className="flex items-center gap-2">
                              <IconClock className="w-4 h-4" />
                              {time}
                            </div>
                            {contact.name && (
                              <div className="flex items-center gap-2">
                                <IconUser className="w-4 h-4" />
                                {contact.name}
                              </div>
                            )}
                          </div>
                        </div>

                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <IconChevronDown className="w-6 h-6 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100"
                        >
                          <div className="p-6 bg-gray-50 space-y-4">
                            {contact.phone && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                  <IconPhone className="w-5 h-5 text-gray-700" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                                    Teléfono
                                  </p>
                                  <p className="text-gray-900 font-medium">{contact.phone}</p>
                                </div>
                              </div>
                            )}

                            {contact.email && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                  <IconMail className="w-5 h-5 text-gray-700" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                                    Email
                                  </p>
                                  <p className="text-gray-900 font-medium">{contact.email}</p>
                                </div>
                              </div>
                            )}

                            {appointment.description && (
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                  Detalles
                                </p>
                                <p className="text-gray-700 text-sm whitespace-pre-line">
                                  {appointment.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {filteredAppointments.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <IconCalendarEvent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay citas programadas</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
