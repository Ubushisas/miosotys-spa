// Placeholder Prisma client for build compatibility
// This app doesn't use Prisma, but some admin routes reference it

// Create a mock prisma client with empty methods
export const prisma = {
  appointment: {
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  service: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
  patient: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  },
} as any;

export default prisma;
