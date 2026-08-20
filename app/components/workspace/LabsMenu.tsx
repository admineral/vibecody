"use client";

import Link from 'next/link';
import { Box, Code2, FlaskConical, FolderTree, Globe, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LABS_LINKS = [
  { href: '/3d-card', label: '3D Card Demo', icon: Box },
  { href: '/3dcode', label: '3D Code Universe', icon: Globe },
  { href: '/codesandbox2', label: 'CodeSandbox', icon: Code2 },
  { href: '/3dsandbox', label: '3D Sandbox', icon: LayoutGrid },
  { href: '/3dfiletree-v2', label: '3D File Tree', icon: FolderTree },
];

export default function LabsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <FlaskConical />
          Labs
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Experiments</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LABS_LINKS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
