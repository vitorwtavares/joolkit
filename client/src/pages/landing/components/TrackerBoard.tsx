// Applications table — the hero centerpiece. A TABLE, not a kanban board.
// All company names are fictional — keep it that way.

const AVATAR_COLORS = [
  '#5b8def',
  '#d2864a',
  '#56b27e',
  '#b06ae0',
  '#e0728f',
  '#4aa6c2',
]

interface Row {
  company: string
  role: string
  status: string
  statusColor: string
  location: string
  deadline: string
}

const ROWS: Row[] = [
  {
    company: 'Northwind',
    role: 'Product Designer',
    status: 'Applied',
    statusColor: '#d2a64f',
    location: 'Remote',
    deadline: 'Apr 18',
  },
  {
    company: 'Lumen Labs',
    role: 'Frontend Engineer',
    status: 'In progress',
    statusColor: '#5b8def',
    location: 'London',
    deadline: 'Apr 22',
  },
  {
    company: 'Foundry',
    role: 'UX Researcher',
    status: 'Prospect',
    statusColor: '#e0728f',
    location: 'Remote',
    deadline: '—',
  },
  {
    company: 'Brightside',
    role: 'Design Engineer',
    status: 'Applied',
    statusColor: '#d2a64f',
    location: 'Berlin',
    deadline: 'Apr 25',
  },
  {
    company: 'Meridian',
    role: 'Product Manager',
    status: 'Prospect',
    statusColor: '#e0728f',
    location: 'New York',
    deadline: '—',
  },
  {
    company: 'Cobalt',
    role: 'Brand Designer',
    status: 'Offer',
    statusColor: '#56b27e',
    location: 'Remote',
    deadline: 'May 2',
  },
]

const TABS: { label: string; count: number; on?: boolean }[] = [
  { label: 'All', count: 278, on: true },
  { label: 'Prospects', count: 15 },
  { label: 'Applied', count: 54 },
  { label: 'In progress', count: 3 },
]

export default function TrackerBoard() {
  return (
    <div className="win">
      <div className="win-bar">
        <span className="win-dot" />
        <span className="win-dot" />
        <span className="win-dot" />
        <span className="win-title mono">joolkit — Applications</span>
      </div>
      <div className="tbl-tabs">
        {TABS.map((tab) => (
          <span className={'tbl-tab' + (tab.on ? ' on' : '')} key={tab.label}>
            {tab.label}
            <span className="cnt">{tab.count}</span>
          </span>
        ))}
        <span className="tbl-new mono">+ New entry</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Location</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={row.company}>
              <td>
                <span className="tbl-co">
                  <span
                    className="tbl-av"
                    style={{
                      background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    }}
                  >
                    {row.company[0]}
                  </span>
                  {row.company}
                </span>
              </td>
              <td style={{ color: '#cbcdd3' }}>{row.role}</td>
              <td>
                <span
                  className="badge"
                  style={{
                    color: row.statusColor,
                    background: `color-mix(in srgb, ${row.statusColor} 17%, transparent)`,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 9,
                      background: row.statusColor,
                    }}
                  />
                  {row.status}
                </span>
              </td>
              <td style={{ color: '#cbcdd3' }}>{row.location}</td>
              <td className="mono" style={{ color: '#a8abb3' }}>
                {row.deadline}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
