export const MOCK_USERS = [
  {
    id: 't1',
    name: 'Dr. Priya Sharma',
    email: 'priya@campus.edu',
    password: 'teacher123',
    role: 'teacher',
    department: 'Computer Science',
    avatar: 'PS',
  },
  {
    id: 't2',
    name: 'Prof. Arun Mehta',
    email: 'arun@campus.edu',
    password: 'teacher123',
    role: 'teacher',
    department: 'Mathematics',
    avatar: 'AM',
  },
  {
    id: 's1',
    name: 'Rahul Verma',
    email: 'rahul@campus.edu',
    password: 'student123',
    role: 'student',
    rollNo: 'CS21001',
    department: 'Computer Science',
    avatar: 'RV',
    points: 980,
    lecturesWatched: 24,
  },
  {
    id: 's2',
    name: 'Ananya Singh',
    email: 'ananya@campus.edu',
    password: 'student123',
    role: 'student',
    rollNo: 'CS21002',
    department: 'Computer Science',
    avatar: 'AS',
    points: 1120,
    lecturesWatched: 31,
  },
  {
    id: 's3',
    name: 'Vikram Patel',
    email: 'vikram@campus.edu',
    password: 'student123',
    role: 'student',
    rollNo: 'CS21003',
    department: 'Computer Science',
    avatar: 'VP',
    points: 870,
    lecturesWatched: 19,
  },
  {
    id: 's4',
    name: 'Meera Iyer',
    email: 'meera@campus.edu',
    password: 'student123',
    role: 'student',
    rollNo: 'CS21004',
    department: 'Computer Science',
    avatar: 'MI',
    points: 1340,
    lecturesWatched: 38,
  },
  {
    id: 's5',
    name: 'Karan Joshi',
    email: 'karan@campus.edu',
    password: 'student123',
    role: 'student',
    rollNo: 'CS21005',
    department: 'Computer Science',
    avatar: 'KJ',
    points: 760,
    lecturesWatched: 17,
  },
];

export const INITIAL_CLASSES = [
  {
    id: 'c1',
    name: 'Data Structures & Algorithms',
    teacherId: 't1',
    code: 'CS301',
    students: ['s1', 's2', 's3', 's4', 's5'],
    lectures: [
      {
        id: 'l1',
        title: 'Introduction to Arrays',
        duration: '45 min',
        date: '2026-03-10',
        videoUrl: 'https://www.youtube.com/embed/NptnmWvkbTw',
      },
      {
        id: 'l2',
        title: 'Linked Lists Deep Dive',
        duration: '52 min',
        date: '2026-03-12',
        videoUrl: 'https://www.youtube.com/embed/WwfhLC16bis',
      },
      {
        id: 'l3',
        title: 'Binary Trees',
        duration: '48 min',
        date: '2026-03-14',
        videoUrl: 'https://www.youtube.com/embed/oSWTXtMglKE',
      },
    ],
  },
  {
    id: 'c2',
    name: 'Operating Systems',
    teacherId: 't1',
    code: 'CS302',
    students: ['s1', 's2', 's4'],
    lectures: [
      {
        id: 'l4',
        title: 'Process Management',
        duration: '55 min',
        date: '2026-03-11',
        videoUrl: 'https://www.youtube.com/embed/vF8ujItjexE',
      },
    ],
  },
  {
    id: 'c3',
    name: 'Linear Algebra',
    teacherId: 't2',
    code: 'MA201',
    students: ['s2', 's3', 's5'],
    lectures: [],
  },
];

export const INITIAL_QUIZZES = [
  {
    id: 'q1',
    title: 'DSA Mid-Term Quiz',
    classId: 'c1',
    teacherId: 't1',
    deadline: '2026-03-25T18:00',
    status: 'active',
    questions: [
      {
        id: 'qq1',
        text: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correct: 1,
      },
      {
        id: 'qq2',
        text: 'Which data structure uses LIFO?',
        options: ['Queue', 'Stack', 'Tree', 'Graph'],
        correct: 1,
      },
      {
        id: 'qq3',
        text: 'What is a linked list node composed of?',
        options: ['Data only', 'Pointer only', 'Data and pointer', 'None'],
        correct: 2,
      },
    ],
    maxScore: 30,
    submissions: {
      s1: { answers: [1, 1, 2], score: 30, submitted: true },
      s2: { answers: [1, 1, 0], score: 20, submitted: true },
      s4: { answers: [0, 1, 2], score: 20, submitted: true },
    },
  },
  {
    id: 'q2',
    title: 'Arrays & Sorting Quiz',
    classId: 'c1',
    teacherId: 't1',
    deadline: '2026-04-01T18:00',
    status: 'upcoming',
    questions: [
      {
        id: 'qq4',
        text: 'Bubble sort worst-case complexity?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(n log n)'],
        correct: 2,
      },
      {
        id: 'qq5',
        text: 'Which sorting algorithm is stable?',
        options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Shell Sort'],
        correct: 2,
      },
    ],
    maxScore: 20,
    submissions: {},
  },
];

export const INITIAL_CHATROOMS = [
  {
    id: 'cr1',
    name: 'DSA Doubts',
    classId: 'c1',
    teacherId: 't1',
    messages: [
      {
        id: 'm1',
        userId: 's1',
        text: 'Can someone explain the difference between BFS and DFS?',
        time: '10:30 AM',
        date: '2026-03-20',
      },
      {
        id: 'm2',
        userId: 't1',
        text: 'BFS explores level by level using a queue, while DFS goes deep first using a stack or recursion.',
        time: '10:45 AM',
        date: '2026-03-20',
      },
      {
        id: 'm3',
        userId: 's2',
        text: 'Thank you! That makes it much clearer.',
        time: '10:47 AM',
        date: '2026-03-20',
      },
    ],
  },
  {
    id: 'cr2',
    name: 'OS Concepts',
    classId: 'c2',
    teacherId: 't1',
    messages: [],
  },
];

export const INITIAL_ATTENDANCE = {
  c1: {
    '2026-03-10': { s1: true,  s2: true,  s3: false, s4: true,  s5: true  },
    '2026-03-12': { s1: true,  s2: false, s3: true,  s4: true,  s5: false },
    '2026-03-14': { s1: false, s2: true,  s3: true,  s4: true,  s5: true  },
  },
};

export const TIMETABLE = {
  t1: {
    Monday:    ['CS301 — 9:00 AM', 'CS302 — 11:00 AM'],
    Tuesday:   ['CS301 — 10:00 AM'],
    Wednesday: ['CS302 — 9:00 AM', 'CS301 — 2:00 PM'],
    Thursday:  ['CS301 — 11:00 AM'],
    Friday:    ['CS302 — 10:00 AM', 'Office Hours — 3:00 PM'],
    Saturday:  [],
    Sunday:    [],
  },
  s1: {
    Monday:    ['CS301 — 9:00 AM', 'CS302 — 11:00 AM'],
    Tuesday:   ['CS301 — 10:00 AM', 'Lab — 2:00 PM'],
    Wednesday: ['CS302 — 9:00 AM'],
    Thursday:  ['CS301 — 11:00 AM', 'Tutorial — 3:00 PM'],
    Friday:    ['Sports — 4:00 PM'],
    Saturday:  [],
    Sunday:    [],
  },
};

export const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const AVATAR_COLORS = [
  '#4F46E5','#0891B2','#059669','#D97706',
  '#DC2626','#7C3AED','#DB2777','#0284C7',
];
