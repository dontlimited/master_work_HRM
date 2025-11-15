import { PrismaClient, Role, AttendanceStatus, LeaveStatus, VacancyStatus, CandidateStatus, GoalStatus, FeedbackType, FeedbackRole, EmploymentEventType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { testPrisma } from '../setupTestEnv';

export type TestFactory = {
  user: (overrides?: Partial<any>) => Promise<any>;
  employee: (overrides?: Partial<any>) => Promise<any>;
  department: (overrides?: Partial<any>) => Promise<any>;
  position: (overrides?: Partial<any>) => Promise<any>;
  attendance: (overrides?: Partial<any>) => Promise<any>;
  leaveRequest: (overrides?: Partial<any>) => Promise<any>;
  timeEntry: (overrides?: Partial<any>) => Promise<any>;
  document: (overrides?: Partial<any>) => Promise<any>;
  vacancy: (overrides?: Partial<any>) => Promise<any>;
  candidate: (overrides?: Partial<any>) => Promise<any>;
  interview: (overrides?: Partial<any>) => Promise<any>;
  course: (overrides?: Partial<any>) => Promise<any>;
  enrollment: (overrides?: Partial<any>) => Promise<any>;
  certification: (overrides?: Partial<any>) => Promise<any>;
  goal: (overrides?: Partial<any>) => Promise<any>;
  review: (overrides?: Partial<any>) => Promise<any>;
  feedbackCycle: (overrides?: Partial<any>) => Promise<any>;
  feedbackQuestion: (overrides?: Partial<any>) => Promise<any>;
  feedbackResponse: (overrides?: Partial<any>) => Promise<any>;
  employmentEvent: (overrides?: Partial<any>) => Promise<any>;
};

export const factory: TestFactory = {
  user: async (overrides = {}) => {
    const defaults = {
      email: `test-${Date.now()}-${Math.random()}@test.com`,
      password: await bcrypt.hash('Test123!', 10),
      firstName: 'Test',
      lastName: 'User',
      role: Role.EMPLOYEE
    };
    return testPrisma.user.create({
      data: { ...defaults, ...overrides }
    });
  },

  employee: async (overrides = {}) => {
    let user = overrides.userId ? await testPrisma.user.findUnique({ where: { id: overrides.userId } }) : null;
    if (!user) {
      user = await factory.user(overrides.user || {});
    }
    const defaults = {
      userId: user.id,
      archived: false
    };
    return testPrisma.employee.create({
      data: { ...defaults, ...overrides, userId: user.id },
      include: { user: true, department: true, position: true }
    });
  },

  department: async (overrides = {}) => {
    const defaults = {
      name: `Department-${Date.now()}`
    };
    return testPrisma.department.create({
      data: { ...defaults, ...overrides }
    });
  },

  position: async (overrides = {}) => {
    const defaults = {
      title: `Position-${Date.now()}`,
      description: 'Test position',
      competencies: ['skill1', 'skill2'],
      grade: 'L3',
      salaryMin: 50000,
      salaryMax: 100000
    };
    return testPrisma.position.create({
      data: { ...defaults, ...overrides }
    });
  },

  attendance: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const defaults = {
      employeeId: employee.id,
      date: new Date(),
      status: AttendanceStatus.PRESENT
    };
    return testPrisma.attendance.create({
      data: { ...defaults, ...overrides, employeeId: employee.id }
    });
  },

  leaveRequest: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5);
    const defaults = {
      employeeId: employee.id,
      startDate,
      endDate,
      reason: 'Test leave',
      status: LeaveStatus.PENDING
    };
    return testPrisma.leaveRequest.create({
      data: { ...defaults, ...overrides, employeeId: employee.id }
    });
  },

  timeEntry: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const date = new Date();
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(18, 0, 0, 0);
    const defaults = {
      employeeId: employee.id,
      date,
      startTime,
      endTime
    };
    return testPrisma.timeEntry.create({
      data: { ...defaults, ...overrides, employeeId: employee.id }
    });
  },

  document: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    const defaults = {
      filename: `test-${Date.now()}.pdf`,
      path: `/uploads/test-${Date.now()}.pdf`,
      category: 'contract',
      tags: ['test'],
      version: 1,
      employeeId: employee?.id || null
    };
    return testPrisma.document.create({
      data: { ...defaults, ...overrides }
    });
  },

  vacancy: async (overrides = {}) => {
    const defaults = {
      title: `Vacancy-${Date.now()}`,
      description: 'Test vacancy',
      status: VacancyStatus.OPEN,
      skills: ['JavaScript', 'TypeScript']
    };
    return testPrisma.vacancy.create({
      data: { ...defaults, ...overrides }
    });
  },

  candidate: async (overrides = {}) => {
    let vacancy = overrides.vacancyId ? await testPrisma.vacancy.findUnique({ where: { id: overrides.vacancyId } }) : null;
    if (!vacancy) {
      vacancy = await factory.vacancy();
    }
    const defaults = {
      vacancyId: vacancy.id,
      firstName: 'John',
      lastName: 'Doe',
      email: `candidate-${Date.now()}@test.com`,
      skills: ['JavaScript'],
      tags: ['remote'],
      status: CandidateStatus.APPLIED,
      duplicate: false
    };
    return testPrisma.candidate.create({
      data: { ...defaults, ...overrides, vacancyId: vacancy.id }
    });
  },

  interview: async (overrides = {}) => {
    let candidate = overrides.candidateId ? await testPrisma.candidate.findUnique({ where: { id: overrides.candidateId } }) : null;
    if (!candidate) {
      candidate = await factory.candidate();
    }
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);
    const defaults = {
      candidateId: candidate.id,
      scheduledAt,
      notes: 'Test interview'
    };
    return testPrisma.interview.create({
      data: { ...defaults, ...overrides, candidateId: candidate.id }
    });
  },

  course: async (overrides = {}) => {
    const defaults = {
      title: `Course-${Date.now()}`,
      description: 'Test course'
    };
    return testPrisma.course.create({
      data: { ...defaults, ...overrides }
    });
  },

  enrollment: async (overrides = {}) => {
    let course = overrides.courseId ? await testPrisma.course.findUnique({ where: { id: overrides.courseId } }) : null;
    if (!course) {
      course = await factory.course();
    }
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const defaults = {
      courseId: course.id,
      employeeId: employee.id,
      progress: 0,
      completed: false
    };
    return testPrisma.enrollment.create({
      data: { ...defaults, ...overrides, courseId: course.id, employeeId: employee.id }
    });
  },

  certification: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const defaults = {
      employeeId: employee.id,
      name: `Cert-${Date.now()}`
    };
    return testPrisma.certification.create({
      data: { ...defaults, ...overrides, employeeId: employee.id }
    });
  },

  goal: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const defaults = {
      employeeId: employee.id,
      title: `Goal-${Date.now()}`,
      description: 'Test goal',
      status: GoalStatus.ACTIVE
    };
    return testPrisma.goal.create({
      data: { ...defaults, ...overrides, employeeId: employee.id }
    });
  },

  review: async (overrides = {}) => {
    let goal = overrides.goalId ? await testPrisma.goal.findUnique({ where: { id: overrides.goalId } }) : null;
    if (!goal) {
      goal = await factory.goal();
    }
    let reviewer = overrides.reviewerId ? await testPrisma.employee.findUnique({ where: { id: overrides.reviewerId } }) : null;
    if (!reviewer) {
      reviewer = await factory.employee();
    }
    const defaults = {
      goalId: goal.id,
      reviewerId: reviewer.id,
      rating: 5,
      feedback: 'Good work'
    };
    return testPrisma.review.create({
      data: { ...defaults, ...overrides, goalId: goal.id, reviewerId: reviewer.id }
    });
  },

  feedbackCycle: async (overrides = {}) => {
    const defaults = {
      title: `Cycle-${Date.now()}`,
      startsAt: new Date()
    };
    return testPrisma.feedbackCycle.create({
      data: { ...defaults, ...overrides }
    });
  },

  feedbackQuestion: async (overrides = {}) => {
    let cycle = overrides.cycleId ? await testPrisma.feedbackCycle.findUnique({ where: { id: overrides.cycleId } }) : null;
    if (!cycle) {
      cycle = await factory.feedbackCycle();
    }
    const defaults = {
      cycleId: cycle.id,
      text: 'How well did the employee perform?',
      type: FeedbackType.SCALE
    };
    return testPrisma.feedbackQuestion.create({
      data: { ...defaults, ...overrides, cycleId: cycle.id }
    });
  },

  feedbackResponse: async (overrides = {}) => {
    let cycle = overrides.cycleId ? await testPrisma.feedbackCycle.findUnique({ where: { id: overrides.cycleId } }) : null;
    if (!cycle) {
      cycle = await factory.feedbackCycle();
    }
    let question = overrides.questionId ? await testPrisma.feedbackQuestion.findUnique({ where: { id: overrides.questionId } }) : null;
    if (!question) {
      question = await factory.feedbackQuestion({ cycleId: cycle.id });
    }
    let targetEmployee = overrides.targetEmpId ? await testPrisma.employee.findUnique({ where: { id: overrides.targetEmpId } }) : null;
    if (!targetEmployee) {
      targetEmployee = await factory.employee();
    }
    let reviewerEmployee = overrides.reviewerEmpId ? await testPrisma.employee.findUnique({ where: { id: overrides.reviewerEmpId } }) : null;
    if (!reviewerEmployee) {
      reviewerEmployee = await factory.employee();
    }
    const defaults = {
      cycleId: cycle.id,
      questionId: question.id,
      targetEmpId: targetEmployee.id,
      reviewerEmpId: reviewerEmployee.id,
      reviewerRole: FeedbackRole.PEER,
      rating: 4,
      comment: 'Good performance'
    };
    return testPrisma.feedbackResponse.create({
      data: { ...defaults, ...overrides, cycleId: cycle.id, questionId: question.id, targetEmpId: targetEmployee.id, reviewerEmpId: reviewerEmployee.id }
    });
  },

  employmentEvent: async (overrides = {}) => {
    let employee = overrides.employeeId ? await testPrisma.employee.findUnique({ where: { id: overrides.employeeId } }) : null;
    if (!employee) {
      employee = await factory.employee();
    }
    const defaults = {
      employeeId: employee.id,
      type: EmploymentEventType.HIRED,
      title: 'Hired',
      details: 'Employee was hired'
    };
    return testPrisma.employmentEvent.create({
      data: { ...defaults, ...overrides, employeeId: employee.id }
    });
  }
};

