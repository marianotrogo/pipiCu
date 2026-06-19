'use client' // Importante: los formularios necesitan interactividad

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // El primer parámetro es "credentials" porque así lo definimos en route.js
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // Evita que recargue la página para manejar el error nosotros
    });

    if (result.error) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
      setLoading(false);
    } else {
      // Si todo sale bien, mandamos al usuario al dashboard o inicio
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🍔 Sistema de Ventas
        </h1>
        
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="admin@demo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}