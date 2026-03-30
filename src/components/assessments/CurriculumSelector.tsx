'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Curriculum {
  id: string;
  country: string;
  body: string;
  level: string;
  subject: string;
}

interface CurriculumSelectorProps {
  onSelect: (curriculum: Curriculum) => void;
  selectedId?: string;
}

export const CurriculumSelector: React.FC<CurriculumSelectorProps> = ({ onSelect, selectedId }) => {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurricula = async () => {
      try {
        const response = await fetch('/api/curricula');
        const data = await response.json();
        setCurricula(data);
      } catch (error) {
        console.error('Failed to fetch curricula:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurricula();
  }, []);

  const handleValueChange = (id: string) => {
    const selected = curricula.find((c) => c.id === id);
    if (selected) {
      onSelect(selected);
    }
  };

  if (loading) return <div>Loading curricula...</div>;

  return (
    <div className="space-y-2">
      <Label htmlFor="curriculum-select">Select Curriculum</Label>
      <Select onValueChange={handleValueChange} defaultValue={selectedId}>
        <SelectTrigger id="curriculum-select" className="w-full">
          <SelectValue placeholder="Choose a curriculum..." />
        </SelectTrigger>
        <SelectContent>
          {curricula.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {`${c.country.toUpperCase()} - ${c.body.toUpperCase()} ${c.level.toUpperCase()} ${c.subject}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
