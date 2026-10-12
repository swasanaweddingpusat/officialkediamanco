import { lazy, Suspense, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FloatingChat = lazy(() => import('./FloatingChat').then(module => ({ default: module.FloatingChat })));

export function DeferredChat() {
  const [activated, setActivated] = useState(false);
  const { pathname } = useLocation();
  if (pathname === '/venue-only') return null;
  const launcher = <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"><Button type="button" size="icon" onClick={() => setActivated(true)} className="size-14 rounded-2xl shadow-2xl transition-transform hover:scale-105" aria-label="Buka concierge Kediaman"><MessageCircle className="size-6" /></Button></div>;
  return activated ? <Suspense fallback={launcher}><FloatingChat initiallyOpen /></Suspense> : launcher;
}