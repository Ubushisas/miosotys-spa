'use client'

import { useState } from 'react'
import { Search, User, Phone, Mail, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Paciente {
  id: string
  nombre: string
  email: string
  telefono: string
  ultimaVisita: string
  proximaCita: string | null
  totalVisitas: number
  gastadoTotal: number
  estado: 'activo' | 'inactivo'
}

// Datos de ejemplo - pacientes
const pacientesEjemplo: Paciente[] = [
  { id: '1', nombre: 'María González', email: 'maria.g@email.com', telefono: '+1 234-5678', ultimaVisita: 'Hace 2 días', proximaCita: 'Mañana 10:00', totalVisitas: 12, gastadoTotal: 620000, estado: 'activo' },
  { id: '2', nombre: 'Carlos Ruiz', email: 'carlos.r@email.com', telefono: '+1 234-5679', ultimaVisita: 'Hace 1 semana', proximaCita: 'Viernes 11:30', totalVisitas: 8, gastadoTotal: 445000, estado: 'activo' },
  { id: '3', nombre: 'Ana López', email: 'ana.l@email.com', telefono: '+1 234-5680', ultimaVisita: 'Hace 3 días', proximaCita: null, totalVisitas: 15, gastadoTotal: 825000, estado: 'activo' },
  { id: '4', nombre: 'Pedro Martínez', email: 'pedro.m@email.com', telefono: '+1 234-5681', ultimaVisita: 'Hoy', proximaCita: 'Hoy 15:45', totalVisitas: 3, gastadoTotal: 170000, estado: 'activo' },
  { id: '5', nombre: 'Laura Sánchez', email: 'laura.s@email.com', telefono: '+1 234-5682', ultimaVisita: 'Hace 1 mes', proximaCita: null, totalVisitas: 20, gastadoTotal: 1170000, estado: 'activo' },
  { id: '6', nombre: 'Jorge Ramírez', email: 'jorge.r@email.com', telefono: '+1 234-5683', ultimaVisita: 'Hace 2 semanas', proximaCita: 'Lunes 14:00', totalVisitas: 6, gastadoTotal: 340000, estado: 'activo' },
  { id: '7', nombre: 'Carmen Torres', email: 'carmen.t@email.com', telefono: '+1 234-5684', ultimaVisita: 'Hace 5 días', proximaCita: null, totalVisitas: 18, gastadoTotal: 945000, estado: 'activo' },
  { id: '8', nombre: 'Roberto Díaz', email: 'roberto.d@email.com', telefono: '+1 234-5685', ultimaVisita: 'Hace 3 meses', proximaCita: null, totalVisitas: 4, gastadoTotal: 210000, estado: 'inactivo' },
]

export default function PacientesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [pacientes] = useState<Paciente[]>(pacientesEjemplo)

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.telefono.includes(busqueda)
  )

  const stats = {
    total: pacientes.length,
    activos: pacientes.filter(p => p.estado === 'activo').length,
    conCitas: pacientes.filter(p => p.proximaCita !== null).length,
    ingresos: pacientes.reduce((sum, p) => sum + p.gastadoTotal, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tu base de datos de pacientes
          </p>
        </div>
      </div>

      {/* Stats Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              TOTAL PACIENTES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activos} activos
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              CON CITAS PRÓXIMAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conCitas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.conCitas / stats.total) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              INGRESOS TOTALES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.ingresos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio ${Math.round(stats.ingresos / stats.total)} por paciente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card className="border border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">
            Todos los Pacientes ({pacientesFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {pacientesFiltrados.map((paciente) => (
              <Link
                key={paciente.id}
                href={`/admin/patients/${paciente.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>

                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {paciente.nombre}
                      </h3>
                      <Badge variant={paciente.estado === 'activo' ? 'default' : 'secondary'}>
                        {paciente.estado}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {paciente.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {paciente.telefono}
                      </div>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Visitas</div>
                      <div className="text-sm font-semibold">{paciente.totalVisitas}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Gastado</div>
                      <div className="text-sm font-semibold">${paciente.gastadoTotal}</div>
                    </div>
                    <div className="text-center min-w-[120px]">
                      <div className="text-xs text-muted-foreground">Última Visita</div>
                      <div className="text-sm font-semibold">{paciente.ultimaVisita}</div>
                    </div>
                  </div>

                  {/* Próxima Cita */}
                  <div className="hidden lg:block min-w-[140px]">
                    {paciente.proximaCita ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{paciente.proximaCita}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin cita</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
