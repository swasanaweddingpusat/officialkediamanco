import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useCMS';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          navigate('/');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const defaultBackgroundImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80';
  const backgroundImage = (siteSettings as any)?.auth_background_url || defaultBackgroundImage;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-5rem)] flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-6 sm:mb-8">
              {siteSettings?.logo_url ? (
                <img
                  src={siteSettings.logo_url}
                  alt={siteSettings.site_name || 'Logo'}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="p-2 bg-primary rounded-lg">
                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <span className="font-display text-xl sm:text-2xl tracking-wider">
                    {siteSettings?.site_name || 'POWER GYM'}
                  </span>
                </>
              )}
            </Link>

            <h1 className="font-display text-3xl sm:text-4xl mb-2">
              {isLogin ? 'WELCOME BACK' : 'JOIN US'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
              {isLogin
                ? 'Sign in to access your account'
                : 'Create an account to start your fitness journey'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full btn-glow" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            <p className="text-center mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent z-10" />
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
