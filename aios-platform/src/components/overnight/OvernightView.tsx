import { useState } from 'react';
import { ChevronLeft, Moon, Search } from 'lucide-react';
import { CockpitButton, CockpitInput } from '../ui';
import { useOvernightStore } from '../../stores/overnightStore';
import ProgramList from './ProgramList';
import ProgramDetail from './ProgramDetail';

const variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function OvernightView() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    level,
    programs,
    selectedProgramId,
    goBack,
    selectProgram,
  } = useOvernightStore();

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-0 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {level === 1 && (
            <div className="flex items-center gap-3">
              <Moon size={22} className="text-[var(--aiox-blue)]" />
              <h1 className="heading-display text-xl font-semibold text-primary type-h2">Overnight Programs</h1>
            </div>
          )}

          {level >= 2 && selectedProgram && (
            <>
              <CockpitButton
                size="sm"
                variant="ghost"
                onClick={goBack}
                leftIcon={<ChevronLeft size={14} />}
              >
                {level === 3 ? selectedProgram.name : 'Overnight'}
              </CockpitButton>
              <span className="text-tertiary text-sm">/</span>
              <span className="text-sm text-primary font-medium">
                {level === 2 ? selectedProgram.name : 'Experiment'}
              </span>
            </>
          )}
        </div>

        {/* Search (level 1 only) */}
        {level === 1 && (
          <CockpitInput
            placeholder="Search programs..."
            leftIcon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {/* Content with AnimatePresence */}
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        {level === 1 && (
            <div
              key="program-list"
              className="p-6"
            >
              <ProgramList
                programs={programs}
                searchQuery={searchQuery}
                onSelectProgram={selectProgram}
              />
            </div>
          )}

          {level >= 2 && selectedProgram && (
            <div
              key={`program-${selectedProgram.id}`}
              className="p-6"
            >
              <ProgramDetail program={selectedProgram} />
            </div>
          )}
</div>
    </div>
  );
}
