'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
  color?: string
  active: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    price: 0,
    description: '',
    color: '#3B82F6',
    active: true,
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services'

      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchServices()
        setShowForm(false)
        setEditingService(null)
        setFormData({
          name: '',
          duration: 60,
          price: 0,
          description: '',
          color: '#3B82F6',
          active: true,
        })
      }
    } catch (error) {
      console.error('Failed to save service:', error)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description || '',
      color: service.color || '#3B82F6',
      active: service.active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      await fetchServices()
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage your spa services and treatments</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingService(null)
            setFormData({
              name: '',
              duration: 60,
              price: 0,
              description: '',
              color: '#3B82F6',
              active: true,
            })
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingService ? 'Edit Service' : 'New Service'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="e.g., Deep Tissue Massage"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                min="15"
                step="15"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="Brief description of the service"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Service is active and available for booking
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                {editingService ? 'Update' : 'Create'} Service
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingService(null)
                  setFormData({
                    name: '',
                    duration: 60,
                    price: 0,
                    description: '',
                    color: '#3B82F6',
                    active: true,
                  })
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">
            No services yet. Add your first service!
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: service.color + '20' }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: service.color }}
                  ></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {service.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${service.price}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    service.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {service.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
