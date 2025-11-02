// Shared dummy data for SuperAdmin UI
export const DUMMY_USERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@pmftci.edu', role: 'Admin', joined: 'Jan 5, 2025' },
  { id: 2, name: 'Bob Smith', email: 'bob@pmftci.edu', role: 'Student', joined: 'Feb 11, 2025' },
  { id: 3, name: 'Carla Reyes', email: 'carla@pmftci.edu', role: 'Parents', joined: 'Mar 1, 2025' },
  { id: 4, name: 'David Cruz', email: 'david@pmftci.edu', role: 'Admin', joined: 'Mar 18, 2025' },
];

export const DUMMY_INCOMING_FACILITIES = [
  { id: 101, name: 'North Gate', type: 'Gate', submittedBy: 'admin01', submittedAt: 'Apr 2, 2025' },
  { id: 102, name: 'Registrar Annex', type: 'Office', submittedBy: 'admin02', submittedAt: 'Apr 9, 2025' },
  { id: 103, name: 'Room 305', type: 'Room', submittedBy: 'admin03', submittedAt: 'Apr 16, 2025' },
];

export const DUMMY_REPORTS = [
  { id: 201, title: 'Projector not working', category: 'Maintenance', from: 'admin02', created: 'May 4, 2025', status: 'Open' },
  { id: 202, title: 'Unauthorized entry', category: 'Incident', from: 'admin01', created: 'May 7, 2025', status: 'In Review' },
  { id: 203, title: 'Library AC issue', category: 'Maintenance', from: 'admin04', created: 'May 10, 2025', status: 'Resolved' },
];

export const DUMMY_FEEDBACKS = [
  { id: 301, subject: 'Great response time!', from: 'admin03', created: 'Jun 1, 2025', priority: 'Low' },
  { id: 302, subject: 'Need better guidelines for events', from: 'admin02', created: 'Jun 3, 2025', priority: 'Medium' },
  { id: 303, subject: 'Request for more training', from: 'admin01', created: 'Jun 9, 2025', priority: 'High' },
];

// Additional dataset: Reports from Clients
export const DUMMY_CLIENT_REPORTS = [
  { id: 401, title: 'Broken chair in Room 101', category: 'Maintenance', client: 'Jane Doe', created: 'May 12, 2025', status: 'Open' },
  { id: 402, title: 'WiFi intermittent at Library', category: 'Incident', client: 'John Perez', created: 'May 15, 2025', status: 'In Review' },
  { id: 403, title: 'Suggestion: More study tables', category: 'Feedback', client: 'A. Santos', created: 'May 18, 2025', status: 'Resolved' },
];

// New enrollees awaiting approval by SuperAdmin
export const DUMMY_ENROLLEES = [
  { id: 501, name: 'Evan Torres', email: 'evan.torres@pmftci.edu', studentId: 'STU-2025-0001', submittedAt: 'Jun 12, 2025', idImage: '' },
  { id: 502, name: 'Lia Mendoza', email: 'lia.mendoza@pmftci.edu', studentId: 'STU-2025-0002', submittedAt: 'Jun 13, 2025', idImage: '' },
  { id: 503, name: 'Ken Ramos', email: 'ken.ramos@pmftci.edu', studentId: 'STU-2025-0003', submittedAt: 'Jun 14, 2025', idImage: '' },
];
