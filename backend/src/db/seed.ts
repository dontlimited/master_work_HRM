import { prisma } from './client';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'admin@local.test';
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: passwordHash,
      firstName: 'Local',
      lastName: 'Admin',
      role: 'ADMIN'
    }
  });

  const hrEmail = 'hr@local.test';
  const hrUser = await prisma.user.upsert({
    where: { email: hrEmail },
    update: {},
    create: {
      email: hrEmail,
      password: await bcrypt.hash('Hr@12345', 10),
      firstName: 'Local',
      lastName: 'HR',
      role: 'HR'
    }
  });

  const employeeEmail = 'employee@local.test';
  const employeeUser = await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {},
    create: {
      email: employeeEmail,
      password: await bcrypt.hash('Emp@12345', 10),
      firstName: 'Local',
      lastName: 'Employee',
      role: 'EMPLOYEE'
    }
  });

  const candidateEmail = 'candidate@local.test';
  await prisma.user.upsert({
    where: { email: candidateEmail },
    update: {},
    create: {
      email: candidateEmail,
      password: await bcrypt.hash('Cand@12345', 10),
      firstName: 'Local',
      lastName: 'Candidate',
      role: 'CANDIDATE'
    }
  });

  // Create hierarchical departments
  const engineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' }
  });

  const frontend = await prisma.department.upsert({
    where: { name: 'Frontend' },
    update: {},
    create: { name: 'Frontend', parentId: engineering.id }
  });

  const backend = await prisma.department.upsert({
    where: { name: 'Backend' },
    update: {},
    create: { name: 'Backend', parentId: engineering.id }
  });

  const qa = await prisma.department.upsert({
    where: { name: 'QA' },
    update: {},
    create: { name: 'QA', parentId: engineering.id }
  });

  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources' }
  });

  const recruitment = await prisma.department.upsert({
    where: { name: 'Recruitment' },
    update: {},
    create: { name: 'Recruitment', parentId: hrDept.id }
  });

  const training = await prisma.department.upsert({
    where: { name: 'Training & Development' },
    update: {},
    create: { name: 'Training & Development', parentId: hrDept.id }
  });

  // Use engineering as default department
  const dept = engineering;

  // Seed realistic positions/grades
  const positions = [
    { title: 'Junior Software Engineer', grade: 'J1', competencies: ['JavaScript','React','Git'], salaryMin: 1800, salaryMax: 2800 },
    { title: 'Software Engineer', grade: 'M1', competencies: ['TypeScript','Node.js','REST','SQL'], salaryMin: 3000, salaryMax: 4500 },
    { title: 'Senior Software Engineer', grade: 'S1', competencies: ['Node.js','React','AWS','CI/CD'], salaryMin: 5000, salaryMax: 7000 },
    { title: 'QA Engineer', grade: 'M1', competencies: ['Cypress','Playwright','API Testing'], salaryMin: 2500, salaryMax: 3800 },
    { title: 'DevOps Engineer', grade: 'S1', competencies: ['AWS','Terraform','Docker','Kubernetes'], salaryMin: 5200, salaryMax: 7500 }
  ];
  const posByTitle: Record<string, string> = {};
  for (const p of positions) {
    const rec = await prisma.position.upsert({
      where: { title: p.title },
      update: { grade: p.grade, competencies: p.competencies as any, salaryMin: p.salaryMin, salaryMax: p.salaryMax },
      create: { title: p.title, grade: p.grade, competencies: p.competencies as any, salaryMin: p.salaryMin, salaryMax: p.salaryMax }
    });
    posByTitle[p.title] = rec.id;
  }

  // Assign employees to appropriate departments
  await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: { departmentId: backend.id },
    create: {
      userId: employeeUser.id,
      departmentId: backend.id,
      positionId: posByTitle['Software Engineer']
    }
  });

  // Create HR employee
  await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: { departmentId: hrDept.id },
    create: {
      userId: hrUser.id,
      departmentId: hrDept.id,
    }
  });

  // Additional employees linked to positions and departments
  const demoEmployees = [
    { 
      email: 'alice.fe@local.test', 
      firstName: 'Alice', 
      lastName: 'Fe', 
      role: 'EMPLOYEE', 
      position: 'Junior Software Engineer',
      department: frontend
    },
    { 
      email: 'bob.se@local.test', 
      firstName: 'Bob', 
      lastName: 'Se', 
      role: 'EMPLOYEE', 
      position: 'Software Engineer',
      department: backend
    },
    { 
      email: 'carol.sse@local.test', 
      firstName: 'Carol', 
      lastName: 'Sse', 
      role: 'EMPLOYEE', 
      position: 'Senior Software Engineer',
      department: backend
    },
    { 
      email: 'dan.qa@local.test', 
      firstName: 'Dan', 
      lastName: 'Qa', 
      role: 'EMPLOYEE', 
      position: 'QA Engineer',
      department: qa
    },
    { 
      email: 'eve.devops@local.test', 
      firstName: 'Eve', 
      lastName: 'Devops', 
      role: 'EMPLOYEE', 
      position: 'DevOps Engineer',
      department: backend
    }
  ];
  for (const d of demoEmployees) {
    const u = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { email: d.email, password: await bcrypt.hash('Pass@12345', 10), firstName: d.firstName, lastName: d.lastName, role: d.role as any }
    });
    await prisma.employee.upsert({
      where: { userId: u.id },
      update: { departmentId: d.department.id },
      create: { 
        userId: u.id, 
        departmentId: d.department.id, 
        positionId: posByTitle[d.position] 
      }
    });
  }

  // Create HR department employees
  const hrEmployeeUser = await prisma.user.upsert({
    where: { email: 'hr.recruiter@local.test' },
    update: {},
    create: {
      email: 'hr.recruiter@local.test',
      password: await bcrypt.hash('Pass@12345', 10),
      firstName: 'Sarah',
      lastName: 'Recruiter',
      role: 'HR'
    }
  });
  await prisma.employee.upsert({
    where: { userId: hrEmployeeUser.id },
    update: { departmentId: recruitment.id },
    create: {
      userId: hrEmployeeUser.id,
      departmentId: recruitment.id,
    }
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@local.test' },
    update: {},
    create: {
      email: 'trainer@local.test',
      password: await bcrypt.hash('Pass@12345', 10),
      firstName: 'Mike',
      lastName: 'Trainer',
      role: 'HR'
    }
  });
  await prisma.employee.upsert({
    where: { userId: trainerUser.id },
    update: { departmentId: training.id },
    create: {
      userId: trainerUser.id,
      departmentId: training.id,
    }
  });

  // Cleanup any previous demo recruitment entries
  await prisma.interview.deleteMany({ where: { id: { in: ['seed-interview-1'] } } }).catch(() => undefined);
  await prisma.candidate.deleteMany({ where: { id: { in: ['seed-candidate-1'] } } }).catch(() => undefined);
  await prisma.vacancy.deleteMany({ where: { id: { in: ['seed-vacancy-1'] } } }).catch(() => undefined);

  // Learning & Development - Courses
  const courses = [
    {
      id: 'seed-course-react',
      title: 'React Fundamentals',
      description: 'Learn the fundamentals of React, including components, hooks, and state management. Perfect for developers looking to build modern web applications.',
    },
    {
      id: 'seed-course-typescript',
      title: 'Introduction to TypeScript',
      description: 'Learn the fundamentals of TypeScript, including types, interfaces, and advanced patterns. Perfect for developers looking to enhance their JavaScript skills.',
    },
    {
      id: 'seed-course-react-advanced',
      title: 'React Advanced Patterns',
      description: 'Master advanced React patterns including hooks, context, and performance optimization. Build scalable and maintainable React applications.',
    },
    {
      id: 'seed-course-nodejs',
      title: 'Node.js Backend Development',
      description: 'Comprehensive guide to building robust backend services with Node.js, Express, and modern best practices. Includes authentication and database integration.',
    },
    {
      id: 'seed-course-devops',
      title: 'DevOps Fundamentals',
      description: 'Introduction to DevOps practices, CI/CD pipelines, containerization with Docker, and cloud deployment strategies.',
    },
    {
      id: 'seed-course-database',
      title: 'Database Design & Optimization',
      description: 'Learn database design principles, SQL optimization, indexing strategies, and working with both relational and NoSQL databases.',
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: { title: course.title, description: course.description },
      create: { id: course.id, title: course.title, description: course.description },
    });
  }

  const emp = await prisma.employee.findFirst({ where: { userId: employeeUser.id } });
  if (emp) {
    // Create enrollment for React Fundamentals course
    await prisma.enrollment.upsert({
      where: { id: 'seed-enroll-1' },
      update: {},
      create: { id: 'seed-enroll-1', courseId: 'seed-course-react', employeeId: emp.id, progress: 20 },
    });
  }

  // Recruitment demo vacancies (with descriptions)
  const vacs = [
    {
      id: 'seed-vac-1',
      title: 'Frontend Engineer',
      description: 'Build modern web apps with React and TypeScript. Collaborate with design and backend teams.',
      status: 'OPEN' as const,
      skills: ['React', 'TypeScript', 'MUI']
    },
    {
      id: 'seed-vac-2',
      title: 'Backend Engineer',
      description: 'Design and build scalable APIs with Node.js and PostgreSQL. Experience with Prisma is a plus.',
      status: 'OPEN' as const,
      skills: ['Node.js', 'PostgreSQL', 'Prisma']
    },
    {
      id: 'seed-vac-3',
      title: 'HR Generalist',
      description: 'Drive recruitment processes, onboarding, and employee engagement initiatives.',
      status: 'ON_HOLD' as const,
      skills: ['Recruitment', 'Onboarding', 'Communication']
    }
  ];
  for (const v of vacs) {
    await prisma.vacancy.upsert({
      where: { id: v.id },
      update: { title: v.title, description: v.description, status: v.status as any, skills: v.skills as any },
      create: { id: v.id, title: v.title, description: v.description, status: v.status as any, skills: v.skills as any }
    });
  }

  // Performance demo
  if (emp) {
    const goal = await prisma.goal.upsert({
      where: { id: 'seed-goal-1' },
      update: {},
      create: { id: 'seed-goal-1', employeeId: emp.id, title: 'Ship MVP', status: 'ACTIVE' }
    });
    await prisma.review.upsert({
      where: { id: 'seed-review-1' },
      update: {},
      create: { id: 'seed-review-1', goalId: goal.id, reviewerId: emp.id, rating: 4 }
    });
    await prisma.employmentEvent.upsert({
      where: { id: 'seed-ev-1' },
      update: {},
      create: { id: 'seed-ev-1', employeeId: emp.id, type: 'HIRED', title: 'Hired as Software Engineer' }
    });
    await prisma.employmentEvent.upsert({
      where: { id: 'seed-ev-2' },
      update: {},
      create: { id: 'seed-ev-2', employeeId: emp.id, type: 'PROMOTION', title: 'Promoted to Mid-level Engineer', details: 'Recognized for strong performance' }
    });
  }

  // 360 Feedback seed
  const cycle = await prisma.feedbackCycle.upsert({
    where: { id: 'seed-cycle-360' },
    update: {},
    create: { 
      id: 'seed-cycle-360', 
      title: 'H2 2024 360 Feedback',
      startsAt: new Date('2024-07-01'),
      endsAt: new Date('2024-08-31')
    }
  });
  const qTexts = [
    { id: 'seed-q-1', text: 'Delivers on commitments (1-5)', type: 'SCALE' },
    { id: 'seed-q-2', text: 'Collaborates effectively with team (1-5)', type: 'SCALE' },
    { id: 'seed-q-3', text: 'Communication clarity (1-5)', type: 'SCALE' },
    { id: 'seed-q-4', text: 'Technical expertise (1-5)', type: 'SCALE' },
    { id: 'seed-q-5', text: 'Leadership and mentoring (1-5)', type: 'SCALE' },
    { id: 'seed-q-6', text: 'What should this person continue doing?', type: 'TEXT' },
    { id: 'seed-q-7', text: 'What should this person start/stop doing?', type: 'TEXT' }
  ];
  for (const q of qTexts) {
    await prisma.feedbackQuestion.upsert({
      where: { id: q.id },
      update: { cycleId: cycle.id, text: q.text, type: q.type as any },
      create: { id: q.id, cycleId: cycle.id, text: q.text, type: q.type as any }
    });
  }

  // Get employees for feedback
  const allEmployees = await prisma.employee.findMany({
    include: { user: true }
  });
  
  const employeeEmp = allEmployees.find(e => e.user.email === 'employee@local.test');
  const bobEmp = allEmployees.find(e => e.user.email === 'bob.se@local.test');
  const carolEmp = allEmployees.find(e => e.user.email === 'carol.sse@local.test');
  const aliceEmp = allEmployees.find(e => e.user.email === 'alice.fe@local.test');
  const danEmp = allEmployees.find(e => e.user.email === 'dan.qa@local.test');

  // Create feedback responses
  // Feedback for Bob (Software Engineer) from teammates and manager
  if (employeeEmp && bobEmp && carolEmp && aliceEmp && danEmp) {
    // Carol reviews Bob (PEER, SCALE questions)
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-1' },
      update: {},
      create: {
        id: 'seed-fb-1',
        cycleId: cycle.id,
        questionId: qTexts[0].id, // Delivers on commitments
        targetEmpId: bobEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'PEER',
        rating: 5,
        comment: 'Always meets deadlines and delivers quality work.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-2' },
      update: {},
      create: {
        id: 'seed-fb-2',
        cycleId: cycle.id,
        questionId: qTexts[1].id, // Collaborates effectively
        targetEmpId: bobEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'PEER',
        rating: 4,
        comment: 'Great team player, helps others when needed.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-3' },
      update: {},
      create: {
        id: 'seed-fb-3',
        cycleId: cycle.id,
        questionId: qTexts[2].id, // Communication clarity
        targetEmpId: bobEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'PEER',
        rating: 4,
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-4' },
      update: {},
      create: {
        id: 'seed-fb-4',
        cycleId: cycle.id,
        questionId: qTexts[6].id, // What should continue/stop
        targetEmpId: bobEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'PEER',
        comment: 'Continue: Code reviews and knowledge sharing. Start: Taking more initiative in architecture discussions.',
      }
    });

    // Employee reviews Bob (PEER)
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-5' },
      update: {},
      create: {
        id: 'seed-fb-5',
        cycleId: cycle.id,
        questionId: qTexts[0].id,
        targetEmpId: bobEmp.id,
        reviewerEmpId: employeeEmp.id,
        reviewerRole: 'PEER',
        rating: 4,
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-6' },
      update: {},
      create: {
        id: 'seed-fb-6',
        cycleId: cycle.id,
        questionId: qTexts[3].id, // Technical expertise
        targetEmpId: bobEmp.id,
        reviewerEmpId: employeeEmp.id,
        reviewerRole: 'PEER',
        rating: 5,
        comment: 'Excellent problem-solving skills and deep technical knowledge.',
      }
    });

    // Feedback for Carol (Senior Engineer) - manager and peer reviews
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-7' },
      update: {},
      create: {
        id: 'seed-fb-7',
        cycleId: cycle.id,
        questionId: qTexts[4].id, // Leadership and mentoring
        targetEmpId: carolEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'PEER',
        rating: 5,
        comment: 'Outstanding mentor, always available to help junior developers.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-8' },
      update: {},
      create: {
        id: 'seed-fb-8',
        cycleId: cycle.id,
        questionId: qTexts[2].id, // Communication
        targetEmpId: carolEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'PEER',
        rating: 5,
        comment: 'Clear and concise communication, great at explaining complex topics.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-9' },
      update: {},
      create: {
        id: 'seed-fb-9',
        cycleId: cycle.id,
        questionId: qTexts[6].id, // Continue/stop
        targetEmpId: carolEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'PEER',
        comment: 'Continue: Leading technical initiatives and mentoring. Consider: Delegating more to develop team members.',
      }
    });

    // Feedback for Alice (Junior Engineer)
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-10' },
      update: {},
      create: {
        id: 'seed-fb-10',
        cycleId: cycle.id,
        questionId: qTexts[0].id,
        targetEmpId: aliceEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'MANAGER',
        rating: 4,
        comment: 'Showing good progress, meeting expectations consistently.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-11' },
      update: {},
      create: {
        id: 'seed-fb-11',
        cycleId: cycle.id,
        questionId: qTexts[3].id, // Technical expertise
        targetEmpId: aliceEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'MANAGER',
        rating: 3,
        comment: 'Growing technical skills, would benefit from more hands-on experience.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-12' },
      update: {},
      create: {
        id: 'seed-fb-12',
        cycleId: cycle.id,
        questionId: qTexts[6].id, // Continue/stop
        targetEmpId: aliceEmp.id,
        reviewerEmpId: carolEmp.id,
        reviewerRole: 'MANAGER',
        comment: 'Continue: Asking questions and learning. Start: Taking more ownership of features.',
      }
    });

    // Feedback for Dan (QA Engineer)
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-13' },
      update: {},
      create: {
        id: 'seed-fb-13',
        cycleId: cycle.id,
        questionId: qTexts[0].id,
        targetEmpId: danEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'PEER',
        rating: 5,
        comment: 'Thorough testing, catches issues before production.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-14' },
      update: {},
      create: {
        id: 'seed-fb-14',
        cycleId: cycle.id,
        questionId: qTexts[1].id, // Collaboration
        targetEmpId: danEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'PEER',
        rating: 5,
        comment: 'Great collaboration with dev team, provides valuable testing insights.',
      }
    });

    // Self-review for Bob
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-15' },
      update: {},
      create: {
        id: 'seed-fb-15',
        cycleId: cycle.id,
        questionId: qTexts[0].id,
        targetEmpId: bobEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'SELF',
        rating: 4,
        comment: 'Generally meet deadlines, but could improve time estimation.',
      }
    });
    await prisma.feedbackResponse.upsert({
      where: { id: 'seed-fb-16' },
      update: {},
      create: {
        id: 'seed-fb-16',
        cycleId: cycle.id,
        questionId: qTexts[6].id, // Continue/stop
        targetEmpId: bobEmp.id,
        reviewerEmpId: bobEmp.id,
        reviewerRole: 'SELF',
        comment: 'Continue: Learning new technologies. Improve: Better documentation of decisions.',
      }
    });
  }

  // Metrics snapshot
  await prisma.metricSnapshot.create({ data: { employees: 1, openVacancies: 1, avgTimeToFill: 30 } }).catch(() => undefined);

  // eslint-disable-next-line no-console
  console.log('Seed completed. Admin user:', admin.email);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


