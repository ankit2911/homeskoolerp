import { db } from '@/lib/db';

async function main() {
    const subjects = await db.subject.findMany({
        include: {
            chapters: {
                include: { topics: true }
            }
        }
    });

    console.log('--- DB CHECK ---');
    console.log(`Total Subjects: ${subjects.length}`);
    subjects.forEach(s => {
        console.log(`Subject: ${s.name} (ID: ${s.id})`);
        console.log(`  Chapters: ${s.chapters.length}`);
        s.chapters.forEach(c => {
            console.log(`    - ${c.name} (Topics: ${c.topics.length})`);
        });
    });
    console.log('----------------');
}

main();
