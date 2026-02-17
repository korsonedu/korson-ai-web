import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import api from '@/lib/api';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users/register/', { username, password });
      navigate('/login');
    } catch (err: any) {
      setError(Object.values(err.response?.data || {}).flat()[0] as string || '注册失败，请换个用户名试试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl p-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">创建账号</CardTitle>
          <CardDescription>开启你的学术天梯之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="space-y-2">
              <Input 
                placeholder="设置用户名" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-50/50 border-none h-12 rounded-xl focus-visible:ring-black"
                required
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="设置密码" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-50/50 border-none h-12 rounded-xl focus-visible:ring-black"
                required
              />
            </div>
            <Button className="w-full h-12 bg-black text-white rounded-xl font-medium hover:bg-black/90 transition-all" disabled={loading}>
              {loading ? "注册中..." : "立即注册"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            已有账号？{" "}
            <Link to="/login" className="text-black font-semibold hover:underline">
              去登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
