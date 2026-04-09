import { useReportData } from '../state/report-data.js';
import { useSelectedArea } from '../state/selected-area.js';
import { useSelectedProject } from '../state/selected-project.js';

export function ProjectFilter() {
  const { projects } = useReportData();
  const { selectedProject, setSelectedProject } = useSelectedProject();
  const { resetSelectedArea } = useSelectedArea();
  const firstProjectName = projects[0]?.name;

  const onProjectChange = (projectName: string | null) => {
    setSelectedProject(projectName);
    resetSelectedArea();
  };

  if (projects.length === 0) return null;

  if (projects.length === 1 && firstProjectName) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ProjectLabel />
        <span className="toolbox-control toolbox-static-control">{firstProjectName}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label htmlFor="project-filter">
        <ProjectLabel />
      </label>
      <select
        id="project-filter"
        value={selectedProject?.name ?? ''}
        onChange={(e) => onProjectChange(e.target.value || null)}
        className="toolbox-button toolbox-control toolbox-select"
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

function ProjectLabel() {
  return (
    <span
      style={{
        fontSize: 13,
        color: 'var(--page-text)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Project:
    </span>
  );
}
