'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  value: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
}

export function CopyButton({ value, label = 'Copy', variant = 'outline', size = 'sm' }: Props) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      toast.success('Đã copy vào clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Không copy được. Thiết bị không hỗ trợ?');
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handle} type="button">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label}
    </Button>
  );
}
