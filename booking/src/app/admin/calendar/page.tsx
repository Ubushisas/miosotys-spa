'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, Clock, Plus, Settings, Power, PowerOff, User, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Cita {
  id: string
  hora: string
  horaFin: string
  paciente: string
  email: string
  telefono: string
  servicio: string
  duracion: number // en minutos
  estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada'
  terapeuta: string
}

// Datos de ejemplo - citas por día
const citasSemana: Record<string, Cita[]> = {
  'Lunes 20': [
    { id: '1', hora: '09:00', horaFin: '10:00', paciente: 'María González', email: 'maria.g@email.com', telefono: '+1 234-5678', servicio: 'Masaje Relajante', duracion: 60, estado: 'confirmada', terapeuta: 'Ana M.' },
    { id: '2', hora: '10:30', horaFin: '11:15', paciente: 'Carlos Ruiz', email: 'carlos.r@email.com', telefono: '+1 234-5679', servicio: 'Facial', duracion: 45, estado: 'pendiente', terapeuta: 'María G.' },
    { id: '3', hora: '14:00', horaFin: '15:30', paciente: 'Ana López', email: 'ana.l@email.com', telefono: '+1 234-5680', servicio: 'Terapia Profunda', duracion: 90, estado: 'confirmada', terapeuta: 'Ana M.' },
  ],
  'Martes 21': [
    { id: '4', hora: '09:30', horaFin: '10:30', paciente: 'Pedro Martínez', email: 'pedro.m@email.com', telefono: '+1 234-5681', servicio: 'Aromaterapia', duracion: 60, estado: 'confirmada', terapeuta: 'Carlos R.' },
    { id: '5', hora: '11:00', horaFin: '12:00', paciente: 'Laura Sánchez', email: 'laura.s@email.com', telefono: '+1 234-5682', servicio: 'Masaje Deportivo', duracion: 60, estado: 'confirmada', terapeuta: 'Ana M.' },
  ],
  'Miércoles 22': [
    { id: '6', hora: '10:00', horaFin: '11:00', paciente: 'Jorge Ramírez', email: 'jorge.r@email.com', telefono: '+1 234-5683', servicio: 'Masaje Sueco', duracion: 60, estado: 'pendiente', terapeuta: 'María G.' },
    { id: '7', hora: '15:00', horaFin: '16:15', paciente: 'Carmen Torres', email: 'carmen.t@email.com', telefono: '+1 234-5684', servicio: 'Facial Profundo', duracion: 75, estado: 'confirmada', terapeuta: 'Carlos R.' },
  ],
  'Jueves 23': [
    { id: '8', hora: '09:00', horaFin: '10:30', paciente: 'Roberto Díaz', email: 'roberto.d@email.com', telefono: '+1 234-5685', servicio: 'Terapia', duracion: 90, estado: 'confirmada', terapeuta: 'Ana M.' },
  ],
  'Viernes 24': [
    { id: '9', hora: '10:00', horaFin: '11:00', paciente: 'María González', email: 'maria.g@email.com', telefono: '+1 234-5678', servicio: 'Masaje', duracion: 60, estado: 'confirmada', terapeuta: 'Ana M.' },
    { id: '10', hora: '11:30', horaFin: '12:30', paciente: 'Ana López', email: 'ana.l@email.com', telefono: '+1 234-5680', servicio: 'Aromaterapia', duracion: 60, estado: 'confirmada', terapeuta: 'María G.' },
    { id: '11', hora: '14:00', horaFin: '15:00', paciente: 'Carlos Ruiz', email: 'carlos.r@email.com', telefono: '+1 234-5679', servicio: 'Masaje Deportivo', duracion: 60, estado: 'pendiente', terapeuta: 'Carlos R.' },
  ],
  'Sábado 25': [],
  'Domingo 26': [],
}

// Mapeo de nombres de pacientes a IDs
const pacienteToId: Record<string, string> = {
  'María González': '1',
  'Carlos Ruiz': '2',
  'Ana López': '3',
  'Pedro Martínez': '4',
  'Laura Sánchez': '5',
  'Jorge Ramírez': '6',
  'Carmen Torres': '7',
  'Roberto Díaz': '8',
}

export default function CalendarioPage() {
  const [sistemaActivo, setSistemaActivo] = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes 20')
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null)

  const dias = Object.keys(citasSemana)
  const citasDelDia = citasSemana[diaSeleccionado] || []

  // Estadísticas de la semana
  const totalCitas = Object.values(citasSemana).flat().length
  const citasConfirmadas = Object.values(citasSemana).flat().filter(c => c.estado === 'confirmada').length
  const citasPendientes = Object.values(citasSemana).flat().filter(c => c.estado === 'pendiente').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Calendario</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra horarios, citas y disponibilidad
          </p>
        </div>

        {/* Toggle Sistema de Reservas */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSistemaActivo(!sistemaActivo)}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all ${
              sistemaActivo
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
          >
            {sistemaActivo ? (
              <>
                <Power className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Sistema Activo</div>
                  <div className="text-xs opacity-90">Aceptando reservas</div>
                </div>
              </>
            ) : (
              <>
                <PowerOff className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Sistema Pausado</div>
                  <div className="text-xs opacity-90">No aceptando reservas</div>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner de Estado */}
      {!sistemaActivo && (
        <Card className="border-2 border-dashed border-primary/30 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PowerOff className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">Sistema de Reservas Pausado</div>
                <div className="text-sm text-muted-foreground">
                  Los clientes no pueden agendar nuevas citas hasta que reactives el sistema
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas de la Semana */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              TOTAL CITAS SEMANA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCitas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {citasConfirmadas} confirmadas, {citasPendientes} pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              HORAS PROGRAMADAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(citasSemana).flat().reduce((sum, c) => sum + c.duracion, 0) / 60}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio {Math.round(Object.values(citasSemana).flat().reduce((sum, c) => sum + c.duracion, 0) / totalCitas)} min/cita
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              OCUPACIÓN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((citasConfirmadas / totalCitas) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de confirmación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selector de Día */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Semana del 20 al 26 de Octubre 2025
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {dias.map((dia) => {
              const citasDia = citasSemana[dia].length
              const esSeleccionado = dia === diaSeleccionado
              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionado(dia)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    esSeleccionado
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${esSeleccionado ? 'opacity-90' : 'text-muted-foreground'}`}>
                    {dia.split(' ')[0]}
                  </div>
                  <div className={`text-2xl font-bold ${esSeleccionado ? '' : 'text-foreground'}`}>
                    {dia.split(' ')[1]}
                  </div>
                  {citasDia > 0 && (
                    <div className={`text-xs mt-1 ${esSeleccionado ? 'opacity-90' : 'text-muted-foreground'}`}>
                      {citasDia} cita{citasDia > 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Citas del Día Seleccionado */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Citas para {diaSeleccionado} ({citasDelDia.length})
            </CardTitle>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nueva Cita</span>
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {citasDelDia.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <div className="font-medium">No hay citas programadas</div>
              <div className="text-sm mt-1">Este día está completamente disponible</div>
            </div>
          ) : (
            <div className="divide-y">
              {citasDelDia.map((cita) => (
                <div
                  key={cita.id}
                  className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setCitaSeleccionada(cita)}
                >
                  <div className="flex items-start gap-6">
                    {/* Hora */}
                    <div className="text-center min-w-[80px]">
                      <div className="text-lg font-bold">{cita.hora}</div>
                      <div className="text-xs text-muted-foreground">{cita.horaFin}</div>
                      <div className="text-xs text-muted-foreground mt-1">{cita.duracion} min</div>
                    </div>

                    <div className="h-16 w-[1px] bg-border"></div>

                    {/* Info del Paciente */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/admin/patients/${pacienteToId[cita.paciente] || '1'}`}
                          className="font-semibold text-lg hover:text-primary transition-colors hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cita.paciente}
                        </Link>
                        <Badge variant={
                          cita.estado === 'confirmada' ? 'default' :
                          cita.estado === 'pendiente' ? 'secondary' :
                          cita.estado === 'completada' ? 'default' : 'secondary'
                        }>
                          {cita.estado}
                        </Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {cita.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {cita.telefono}
                        </div>
                      </div>
                    </div>

                    {/* Servicio y Terapeuta */}
                    <div className="text-right min-w-[200px]">
                      <div className="font-medium mb-1">{cita.servicio}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                        <User className="w-3 h-3" />
                        {cita.terapeuta}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button className="p-2 rounded border border-border hover:bg-muted/50 transition-colors">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded border border-border hover:bg-muted/50 transition-colors">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vista de Google Calendar Embebida */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Vista de Google Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tu calendario completo en tiempo real
              </p>
            </div>
            <Badge variant="secondary">🔄 Sincronizado</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-[600px] p-4">
            {/* Placeholder - Aquí irá el iframe de Google Calendar */}
            <div className="w-full h-full rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <div className="text-center p-8">
                <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Conecta tu Google Calendar</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Para ver tu calendario aquí, necesitas conectar tu cuenta de Google Calendar.
                  Una vez conectado, verás todas tus citas en tiempo real.
                </p>
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Conectar ahora
                </button>
                <p className="text-xs text-muted-foreground mt-4">
                  🔒 Conexión segura mediante OAuth 2.0
                </p>
              </div>
            </div>
            {/*
              Cuando esté conectado, reemplazar el placeholder con:
              <iframe
                src="https://calendar.google.com/calendar/embed?src=TU_CALENDAR_ID&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&hl=es"
                className="w-full h-full rounded-lg border border-border"
                frameBorder="0"
                scrolling="no"
              />
            */}
          </div>
        </CardContent>
      </Card>

      {/* Panel de Integración con Google Calendar */}
      <Card className="border-2 border-dashed border-primary/30 bg-muted/10">
        <CardHeader className="border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">🔗 Integración</Badge>
              <CardTitle className="text-base font-semibold">Google Calendar</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sincroniza automáticamente todas las citas con tu Google Calendar
              </p>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Conectar Google Calendar
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="font-semibold mb-1">Sincronización Bidireccional</div>
              <div className="text-sm text-muted-foreground">
                Las citas creadas aquí aparecen en Google Calendar y viceversa
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="font-semibold mb-1">Notificaciones Automáticas</div>
              <div className="text-sm text-muted-foreground">
                Los pacientes reciben recordatorios por email antes de su cita
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="font-semibold mb-1">Gestión de Disponibilidad</div>
              <div className="text-sm text-muted-foreground">
                Bloquea horarios personales directamente desde Google Calendar
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
