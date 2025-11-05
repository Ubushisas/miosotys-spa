'use client'

import { ArrowLeft, Phone, Mail, Calendar, DollarSign, Clock, User, TrendingUp, Activity, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Base de datos de perfiles de salud
const perfilesSalud: Record<string, any> = {
  '1': { tipoPiel: "Mixta sensible", alergias: "Lavanda, Nuez", condiciones: "Migrañas ocasionales", nivelEstres: "Alto (ejecutiva)", preferencias: ["🌡️ Temp. cálida", "🎵 Jazz suave", "🕐 Tardes 16-18h", "👩‍⚕️ Terapeuta: Ana"] },
  '2': { tipoPiel: "Grasa", alergias: "Ninguna conocida", condiciones: "Tensión muscular", nivelEstres: "Medio", preferencias: ["🌡️ Temp. fresca", "🎵 Silencio", "🕐 Mañanas", "💪 Masajes deportivos"] },
  '3': { tipoPiel: "Seca madura", alergias: "Productos químicos", condiciones: "Artritis leve", nivelEstres: "Bajo (retirada)", preferencias: ["🌡️ Temp. cálida", "🎵 Clásica", "🕐 Mañanas 10-12h", "🌿 Solo productos naturales"] },
  '4': { tipoPiel: "Normal", alergias: "En evaluación", condiciones: "Primera visita", nivelEstres: "Medio", preferencias: ["❓ Explorando", "❓ Sin preferencias", "🕐 Flexible", "👨‍⚕️ Cualquier terapeuta"] },
}

// Historial de citas
const historialCitas = [
  { id: '1', fecha: '15 Oct 2025', servicio: 'Masaje Relajante', duracion: '60min', costo: 40000, terapeuta: 'Ana M.', notas: 'Tensión en hombros' },
  { id: '2', fecha: '08 Oct 2025', servicio: 'Facial Profundo', duracion: '45min', costo: 32500, terapeuta: 'Carlos R.', notas: 'Piel sensible' },
  { id: '3', fecha: '01 Oct 2025', servicio: 'Masaje Terapéutico', duracion: '90min', costo: 60000, terapeuta: 'Ana M.', notas: 'Dolor lumbar' },
  { id: '4', fecha: '24 Sep 2025', servicio: 'Aromaterapia', duracion: '60min', costo: 37500, terapeuta: 'María G.', notas: 'Estrés laboral' },
  { id: '5', fecha: '17 Sep 2025', servicio: 'Masaje Deportivo', duracion: '75min', costo: 47500, terapeuta: 'Carlos R.', notas: 'Post-entrenamiento' },
]

// Base de datos de pacientes con métricas expandidas
const pacientesDB: Record<string, any> = {
  '1': { nombre: 'María González', email: 'maria.g@email.com', telefono: '+1 234-5678', estado: 'vip', totalVisitas: 42, frecuencia: '2x/mes', gastadoTotal: 2290000, scoreLealtad: 92, miembroDesde: '2021' },
  '2': { nombre: 'Carlos Ruiz', email: 'carlos.r@email.com', telefono: '+1 234-5679', estado: 'regular', totalVisitas: 18, frecuencia: '1x/mes', gastadoTotal: 945000, scoreLealtad: 75, miembroDesde: '2023' },
  '3': { nombre: 'Ana López', email: 'ana.l@email.com', telefono: '+1 234-5680', estado: 'vip', totalVisitas: 65, frecuencia: '3x/mes', gastadoTotal: 3625000, scoreLealtad: 98, miembroDesde: '2020' },
  '4': { nombre: 'Pedro Martínez', email: 'pedro.m@email.com', telefono: '+1 234-5681', estado: 'nuevo', totalVisitas: 3, frecuencia: 'Nuevo', gastadoTotal: 170000, scoreLealtad: 45, miembroDesde: '2025' },
}

// Recomendaciones AI
function obtenerRecomendacionesAI(estado: string, visitas: number, score: number) {
  const recs: Array<{ titulo: string; desc: string }> = []

  if (estado === 'vip') {
    recs.push({ titulo: "Programa VIP Exclusivo", desc: "Cliente VIP premium. Ofrecer acceso prioritario, terapeuta dedicado y servicios personalizados." })
    if (visitas > 50) {
      recs.push({ titulo: "Membresía Anual Platinum", desc: "Cliente de altísima frecuencia. Proponer membresía anual con beneficios exclusivos." })
    }
  } else if (estado === 'nuevo') {
    recs.push({ titulo: "Programa de Bienvenida", desc: "Cliente nuevo. Asignar consulta de 30 min gratuita para crear plan personalizado." })
    recs.push({ titulo: "Paquete de Inicio", desc: "Ofrecer paquete especial de 3 sesiones con 25% descuento." })
  } else if (estado === 'regular') {
    recs.push({ titulo: "Programa de Fidelización", desc: "Proponer paquete de 6 sesiones con 20% descuento y servicio adicional gratis." })
    if (visitas > 15) {
      recs.push({ titulo: "Upgrade a VIP", desc: "Cliente con historial sólido. Ofrecer transición a estatus VIP." })
    }
  }

  if (score > 80) {
    recs.push({ titulo: "Programa de Referidos VIP", desc: "Cliente altamente leal. Activar programa de referidos con beneficios mutuos." })
  }

  return recs
}

export default function DetallePacientePage() {
  const params = useParams()
  const paciente = pacientesDB[params.id as string] || pacientesDB['1']
  const perfil = perfilesSalud[params.id as string] || perfilesSalud['1']
  const recomendaciones = obtenerRecomendacionesAI(paciente.estado, paciente.totalVisitas, paciente.scoreLealtad)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Link
        href="/admin/patients"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Volver a Pacientes</span>
      </Link>

      {/* Perfil del Paciente */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{paciente.nombre}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={paciente.estado === 'vip' ? 'default' : 'secondary'} className="capitalize">
                  {paciente.estado === 'vip' ? 'VIP' : paciente.estado === 'nuevo' ? 'Nuevo' : 'Regular'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Miembro desde {paciente.miembroDesde}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{paciente.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Teléfono</div>
                <div className="font-medium">{paciente.telefono}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Negocio */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-green-600">{paciente.totalVisitas}</div>
              <div className="text-xs text-muted-foreground mt-1">Visitas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-blue-600">${paciente.gastadoTotal}</div>
              <div className="text-xs text-muted-foreground mt-1">Gasto Total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-purple-600">{paciente.frecuencia}</div>
              <div className="text-xs text-muted-foreground mt-1">Frecuencia</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-orange-600">{paciente.scoreLealtad}/100</div>
              <div className="text-xs text-muted-foreground mt-1">Lealtad</div>
            </div>
          </div>
          {/* Barra de Lealtad */}
          <div className="mt-4 bg-muted/50 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-700 to-gray-900 transition-all duration-1000"
              style={{ width: `${paciente.scoreLealtad}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Salud & Bienestar */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Salud & Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Tipo de Piel</div>
              <div className="font-semibold mt-1">{perfil.tipoPiel}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Alergias</div>
              <div className="font-semibold mt-1">{perfil.alergias}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Condiciones</div>
              <div className="font-semibold mt-1">{perfil.condiciones}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Nivel de Estrés</div>
              <div className="font-semibold mt-1">{perfil.nivelEstres}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">✨ Preferencias</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-2">
            {perfil.preferencias.map((pref: string, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                <span className="text-base">{pref}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones AI */}
      <Card className="border-2 border-dashed border-primary/30 bg-muted/10">
        <CardHeader className="border-b border-primary/20">
          <Badge variant="secondary" className="w-fit mb-2">
            🤖 Recomendaciones AI
          </Badge>
          <CardTitle className="text-base font-semibold">
            Plan para {paciente.nombre.split(' ')[0]}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {recomendaciones.map((rec, i) => (
            <div key={i} className="p-4 rounded-lg bg-background border border-border">
              <div className="font-semibold mb-1">{rec.titulo}</div>
              <div className="text-sm text-muted-foreground">{rec.desc}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Historial de Citas */}
      <Card className="border border-border">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">
            Historial de Citas ({historialCitas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">FECHA</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">SERVICIO</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">TERAPEUTA</th>
                  <th className="text-center p-4 text-xs font-medium text-muted-foreground">DURACIÓN</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground">COSTO</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">NOTAS</th>
                </tr>
              </thead>
              <tbody>
                {historialCitas.map((cita) => (
                  <tr key={cita.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{cita.fecha}</td>
                    <td className="p-4">{cita.servicio}</td>
                    <td className="p-4 text-sm text-muted-foreground">{cita.terapeuta}</td>
                    <td className="p-4 text-center text-sm">{cita.duracion}</td>
                    <td className="p-4 text-right font-medium">${cita.costo}</td>
                    <td className="p-4 text-sm text-muted-foreground">{cita.notas}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td colSpan={4} className="p-4 text-right font-semibold">TOTAL:</td>
                  <td className="p-4 text-right font-bold">
                    ${historialCitas.reduce((sum, c) => sum + c.costo, 0)}
                  </td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
