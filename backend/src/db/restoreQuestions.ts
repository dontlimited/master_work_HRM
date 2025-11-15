import { prisma } from './client';

async function restoreQuestions() {
  console.log('🔄 Starting to restore questions and remove responses...');

  try {
    // 1. Delete all feedback responses (user answers)
    const responsesCount = await prisma.feedbackResponse.deleteMany();
    console.log(`✅ Deleted ${responsesCount.count} feedback responses`);

    // 2. Restore feedback cycle
    const cycle = await prisma.feedbackCycle.upsert({
      where: { id: 'seed-cycle-360' },
      update: {
        title: 'H2 2024 360 Feedback',
        startsAt: new Date('2024-07-01'),
        endsAt: new Date('2024-08-31'),
      },
      create: {
        id: 'seed-cycle-360',
        title: 'H2 2024 360 Feedback',
        startsAt: new Date('2024-07-01'),
        endsAt: new Date('2024-08-31'),
      },
    });
    console.log(`✅ Restored feedback cycle: ${cycle.title}`);

    // 3. Restore all questions
    const qTexts = [
      { id: 'seed-q-1', text: 'Delivers on commitments (1-5)', type: 'SCALE' },
      { id: 'seed-q-2', text: 'Collaborates effectively with team (1-5)', type: 'SCALE' },
      { id: 'seed-q-3', text: 'Communication clarity (1-5)', type: 'SCALE' },
      { id: 'seed-q-4', text: 'Technical expertise (1-5)', type: 'SCALE' },
      { id: 'seed-q-5', text: 'Leadership and mentoring (1-5)', type: 'SCALE' },
      { id: 'seed-q-6', text: 'What should this person continue doing?', type: 'TEXT' },
      { id: 'seed-q-7', text: 'What should this person start/stop doing?', type: 'TEXT' },
    ];

    let questionsCount = 0;
    for (const q of qTexts) {
      await prisma.feedbackQuestion.upsert({
        where: { id: q.id },
        update: { cycleId: cycle.id, text: q.text, type: q.type as any },
        create: { id: q.id, cycleId: cycle.id, text: q.text, type: q.type as any },
      });
      questionsCount++;
    }
    console.log(`✅ Restored ${questionsCount} feedback questions`);

    console.log('\n✨ Questions restored and responses cleared successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  restoreQuestions()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export default restoreQuestions;

