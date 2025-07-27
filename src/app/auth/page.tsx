'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const TEST_ID = 'testuser';
const TEST_PASS = 'testpass';

export default function AuthPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (id === TEST_ID && password === TEST_PASS) {
        localStorage.setItem('auth', 'true');
        router.push('/orderform');
      } else {
        setError('Invalid ID or password');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100">
      <Card className="w-full max-w-sm shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl font-bold text-blue-700">Sign In</CardTitle>
          <p className="text-gray-500 mt-1">Enter your ID and password to access the order form</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <Input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="Enter your ID"
                autoFocus
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            {/* <div className="text-xs text-gray-400 text-center mt-2">
              <span>Test ID: <b>{TEST_ID}</b> &nbsp;|&nbsp; Password: <b>{TEST_PASS}</b></span>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 