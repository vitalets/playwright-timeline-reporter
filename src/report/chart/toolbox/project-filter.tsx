import { useReportData } from '../state/report-data.js';
import { useSelectedArea } from '../state/selected-area.js';
import { useSelectedProject } from '../state/selected-project.js';

export function ProjectFilter() {
  const { projects } = useReportData();
  const { selectedProject, setSelectedProject } = useSelectedProject();
  const { resetSelectedArea } = useSelectedArea();

  const onProjectChange = (projectName: string | null) => {
    setSelectedProject(projectName);
    resetSelectedArea();
  };

  if (projects.length < 2) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label
        htmlFor="project-filter"
        style={{
          fontSize: 13,
          color: 'var(--page-text)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Project
      </label>
      <select
        id="project-filter"
        value={selectedProject?.name ?? ''}
        onChange={(e) => onProjectChange(e.target.value || null)}
        className="toolbox-button"
        style={{ borderRadius: 6, fontSize: 13, padding: '3px 8px', outline: 'none' }}
      >
        <option value="">All</option>
        {projects.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
