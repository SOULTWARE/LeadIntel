'use client';

import { useEffect, type ReactNode } from 'react';
import { useInternalLayout } from '@/components/InternalLayoutContext';

interface InternalLayoutSetterProps {
  title: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export default function InternalLayoutSetter({ title, icon, rightSlot }: InternalLayoutSetterProps) {
  const { setLayout } = useInternalLayout();

  useEffect(() => {
    setLayout({ title, icon, rightSlot });

    return () => {
      setLayout({ title: '' });
    };
  }, [setLayout, title, icon, rightSlot]);

  return null;
}
